"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/client/Header";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  RiArrowRightLine,
  RiTimeLine,
  RiShoppingBagLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiFlowerLine,
  RiBankCardLine,
  RiImageAddLine,
  RiUploadCloudLine,
  RiCheckLine,
  RiAlertLine,
  RiLoaderLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { DEFAULT_DELIVERY_FEE } from "@/lib/site-settings";
import { formatDeliveryLeadDays, getDeliveryDateLabel } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido"),
  address: z.string().min(5, "Dirección muy corta"),
  addressRef: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type PaymentMethod = {
  id: string;
  title: string;
  provider?: string | null;
  visibleLabel?: string | null;
  type: "QR" | "BANK_ACCOUNT" | "INSTRUCTIONS";
  details?: string | null;
  accountNumber?: string | null;
  imageUrl?: string | null;
};

function paymentMethodLabel(method: PaymentMethod) {
  return method.visibleLabel || method.provider || method.title;
}

function paymentMethodTypeLabel(method: PaymentMethod) {
  if (method.type === "QR") return "QR";
  if (method.type === "BANK_ACCOUNT") return "Cuenta bancaria";
  return "Instrucciones";
}

function paymentMethodGuide(method: PaymentMethod) {
  if (method.type === "QR") {
    return method.details || "Escanea el QR y luego sube el comprobante de pago.";
  }
  if (method.type === "BANK_ACCOUNT") {
    return method.details || "Realiza la transferencia y luego sube el comprobante.";
  }
  return method.details || "Sigue estas instrucciones para completar el pago.";
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-400 text-sm";

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutToken = searchParams.get("token") || "";
  const { items, getTotalPrice, getDeliveryLeadDays, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderDeliveryLeadDays, setOrderDeliveryLeadDays] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [loadingLink, setLoadingLink] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerAddressRef, setCustomerAddressRef] = useState("");
  const [checkoutStage, setCheckoutStage] = useState<"details" | "payment">("details");
  const orderAdjustment = typeof createdOrder?.manualAdjustment === "number" ? createdOrder.manualAdjustment : 0;
  const orderStatus = createdOrder?.status || "";
  const paymentStateMessage =
    orderStatus === "PAID"
      ? "Pago validado por el equipo"
      : orderStatus === "PAYMENT_INVALID"
        ? "Pago rechazado, revisa el comprobante"
        : "Esperando validación del pago";

  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;
  const cartDelivery = getDeliveryLeadDays();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0] || null,
    [paymentMethods, selectedMethodId]
  );

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.deliveryFee === "number") setDeliveryFee(data.deliveryFee);
      })
      .catch(() => {});
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((data) => {
        setPaymentMethods(Array.isArray(data) ? data : []);
        setSelectedMethodId(Array.isArray(data) && data[0]?.id ? data[0].id : "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!createdOrder?.paymentMethodId) return;
    setSelectedMethodId(createdOrder.paymentMethodId);
  }, [createdOrder?.paymentMethodId]);

  useEffect(() => {
    if (!checkoutToken) return;
    setLoadingLink(true);
    fetch(`/api/seguimiento?token=${checkoutToken}`)
      .then((r) => r.json())
      .then((order) => {
        if (!order?.id) throw new Error("Pedido no encontrado");
        const orderDeliveryDays = Array.isArray(order.items)
          ? order.items.reduce((max: number, item: any) => Math.max(max, item.product?.deliveryLeadDays || 0), 0)
          : 0;
        setCreatedOrder(order);
        setOrderItems(Array.isArray(order.items) ? order.items.map((item: any) => ({
          id: item.id,
          name: item.product?.name || "Producto",
          image: item.product?.images?.find((img: any) => img.isMain)?.url || item.product?.images?.[0]?.url || "",
          quantity: item.quantity,
          flowers: Array.isArray(item.product?.flowers)
            ? item.product.flowers.map((pf: any) => ({
                id: pf.flower?.id || pf.id,
                name: pf.flower?.name || "Flor",
                type: pf.flower?.type || "",
                quantity: pf.quantity || 1,
              }))
            : [],
          customization: item.customization || null,
          deliveryLeadDays: item.product?.deliveryLeadDays || 0,
          subtotal: item.price * item.quantity + (item.addons || []).reduce((sum: number, a: any) => sum + (a.price || 0), 0) * item.quantity,
        })) : []);
        setOrderTotal(typeof order.total === "number" ? order.total : 0);
        setOrderDeliveryLeadDays(orderDeliveryDays);
        setCustomerName(order.customerName || "");
        setCustomerPhone(order.customerPhone || "");
        setCustomerEmail(order.customerEmail || "");
        setCustomerAddress(order.address || "");
        setCustomerAddressRef(order.addressRef || "");
        setCheckoutStage("details");
      })
      .catch(() => {})
      .finally(() => setLoadingLink(false));
  }, [checkoutToken]);

  const onSubmit = async (data: FormData) => {
    if (!items.length) {
      toast.error("Tu carrito está vacío");
      return;
    }
    setCreatingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items, total, deliveryFee, estimatedTime: cartDelivery.label }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      setCreatedOrder(order);
      setOrderItems(items.map(item => ({
        id: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        flowers: Array.isArray((item as any).flowers)
          ? (item as any).flowers
          : [],
        customization: (item as any).customization || null,
        deliveryLeadDays: (item as any).deliveryLeadDays || 0,
        subtotal: item.subtotal,
      })));
      setOrderTotal(total);
      setOrderDeliveryLeadDays(cartDelivery.days);
      setCustomerName(data.name);
      setCustomerPhone(data.phone);
      setCustomerEmail(data.email);
      setCustomerAddress(data.address);
      setCustomerAddressRef(data.addressRef || "");
      setCheckoutStage("payment");
      clearCart();
      toast.success("Pedido creado. Ahora sube tu comprobante.");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleProofChange = (file?: File) => {
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const uploadProof = async () => {
    if (!createdOrder) return;
    if (!selectedMethod && paymentMethods.length > 0) {
      toast.error("Selecciona un método de pago");
      return;
    }
    if (checkoutToken && (!customerName || !customerPhone || !customerAddress)) {
      toast.error("Completa nombre, teléfono y dirección antes de enviar el comprobante");
      return;
    }
    if (!proofFile) {
      toast.error("Debes subir el comprobante");
      return;
    }

    setSubmittingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", proofFile);
      fd.append("trackingToken", createdOrder.trackingToken);
      fd.append("name", customerName);
      fd.append("phone", customerPhone);
      fd.append("email", customerEmail);
      fd.append("address", customerAddress);
      fd.append("addressRef", customerAddressRef);
      if (selectedMethod?.id) fd.append("paymentMethodId", selectedMethod.id);

      const res = await fetch(`/api/orders/${createdOrder.id}/payment-proof`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible cargar el comprobante");

      toast.success("Comprobante cargado correctamente");
      router.push(`/checkout/confirmacion?token=${createdOrder.trackingToken}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const canContinueToPayment = Boolean(customerName.trim() && customerPhone.trim() && customerAddress.trim());

  if (checkoutToken && loadingLink && !createdOrder) {
    return (
      <main className="min-h-screen bg-[#fdfcf8]">
        <Header />
        <div className="pt-28 text-center py-20">
          <div className="flex justify-center mb-4 text-primary-200"><RiLoaderLine size={64} className="animate-spin" /></div>
          <h2 className="text-2xl font-semibold mb-4">Cargando tu pedido</h2>
          <p className="text-gray-500">Estamos cargando la información de tu pedido.</p>
        </div>
      </main>
    );
  }

  if (!items.length && !createdOrder && !checkoutToken) {
    return (
      <main className="min-h-screen bg-[#fdfcf8]">
        <Header />
        <div className="pt-28 text-center py-20">
          <div className="flex justify-center mb-4 text-gray-200"><RiFlowerLine size={64} /></div>
          <h2 className="text-2xl font-semibold mb-4">Tu carrito está vacío</h2>
          <a href="/flores" className="bg-primary-600 text-white px-8 py-3 rounded-full inline-block hover:bg-primary-700 transition-colors">Ver catálogo</a>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main className="min-h-screen bg-[#fdfcf8]">
        <Header />
        <div className="pt-24 max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
                  <RiCheckLine size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-semibold" style={{ fontFamily: "var(--font-cormorant),Georgia,serif" }}>
                    {checkoutToken ? "Completa tu pedido" : "Pedido creado"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {checkoutToken
                      ? "Completa tus datos, elige un método de pago y sube el comprobante."
                      : "Elige un método de pago, realiza el pago y sube el comprobante para validar tu pedido."}
                  </p>
                </div>
              </div>

              {checkoutStage === "details" && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Paso 1</p>
                  <p className="font-semibold text-gray-900 mt-1">Completa tus datos</p>
                  <div className="grid gap-3 mt-3">
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nombre completo" className={inputCls} />
                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Teléfono" className={inputCls} />
                    <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Correo electrónico" className={inputCls} />
                    <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Dirección de entrega" className={inputCls} />
                    <input value={customerAddressRef} onChange={e => setCustomerAddressRef(e.target.value)} placeholder="Referencia (opcional)" className={inputCls} />
                  </div>
                  <button
                    type="button"
                    onClick={() => canContinueToPayment ? setCheckoutStage("payment") : toast.error("Completa nombre, teléfono y dirección para continuar")}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-full font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Continuar al pago <RiArrowRightLine size={18} />
                  </button>
                </div>
              )}

              {checkoutStage === "payment" && (
                <>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Paso 2</p>
                    <p className="font-semibold text-gray-900 mt-1">Selecciona el método de pago</p>
                    <p className="text-sm text-gray-500 mt-1">Elige el método activo para hacer el pago.</p>
                  </div>

                  <div className="space-y-3">
                    {paymentMethods.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 flex items-start gap-2">
                        <RiAlertLine className="mt-0.5 flex-shrink-0" />
                        <span>No hay métodos de pago activos configurados. Por favor contacta al administrador.</span>
                      </div>
                    ) : (
                      paymentMethods.map(method => {
                        const active = selectedMethodId ? selectedMethodId === method.id : paymentMethods[0]?.id === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`w-full text-left rounded-2xl border p-4 transition-all ${active ? "border-primary-300 bg-primary-50 shadow-sm" : "border-gray-200 bg-white hover:border-primary-200"}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-20 h-20 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {method.type === "QR" && method.imageUrl ? (
                                  <img src={method.imageUrl} alt={method.title} className="w-full h-full object-contain p-2" />
                                ) : (
                                  <RiBankCardLine className="text-gray-300" size={28} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-semibold text-gray-900">{paymentMethodLabel(method)}</p>
                                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                                    {paymentMethodTypeLabel(method)}
                                  </span>
                                </div>
                                {(method.provider || method.accountNumber) && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {method.provider ? method.provider : ""}
                                    {method.provider && method.accountNumber ? " · " : ""}
                                    {method.accountNumber ? method.accountNumber : ""}
                                  </p>
                                )}
                                {method.details && <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{method.details}</p>}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <RiShoppingBagLine className="text-primary-500" /> Resumen
                </h2>
                <div className="space-y-3 mb-5">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image || ""} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                        {item.customization?.bouquetSize && (
                          <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
                            {item.customization.bouquetSize === "ENLARGED"
                              ? "Agrandado"
                              : item.customization.bouquetSize === "REDUCED"
                                ? "Reducido"
                                : "Normal"}
                            {Array.isArray(item.customization.extraFlowers) && item.customization.extraFlowers.length > 0
                              ? ` · ${item.customization.extraFlowers.length} flor${item.customization.extraFlowers.length > 1 ? "es" : ""} extra`
                              : ""}
                          </p>
                        )}
                        {Array.isArray(item.customization?.baseFlowers) && item.customization.baseFlowers.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {item.customization.baseFlowers
                              .map((flower: any) => `${flower.name} x${flower.quantity}`)
                              .join(", ")}
                          </p>
                        )}
                        {Array.isArray(item.flowers) && item.flowers.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {item.flowers.map((flower: any) => `${flower.name} x${flower.quantity || 1}`).join(", ")}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-sm">{formatPrice(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 text-sm text-emerald-700">
                  <RiTimeLine size={15} /> <strong>{formatDeliveryLeadDays(orderDeliveryLeadDays)}</strong>
                  <span className="text-emerald-600">· {getDeliveryDateLabel(orderDeliveryLeadDays)}</span>
                </div>
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1.5"><RiTruckLine size={14} /> Domicilio</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  {orderDeliveryLeadDays > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Entrega</span>
                      <span className="text-emerald-600 font-medium">
                        {getDeliveryDateLabel(orderDeliveryLeadDays)}
                      </span>
                    </div>
                  )}
                  {orderAdjustment !== 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Ajuste manual</span>
                      <span className={orderAdjustment > 0 ? "text-green-600" : "text-red-600"}>
                        {orderAdjustment > 0 ? "+" : ""}
                        {formatPrice(orderAdjustment)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span><span className="text-primary-600">{formatPrice(orderTotal)}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <RiShieldCheckLine size={14} /> {paymentStateMessage}
                </div>
              </div>

              {checkoutToken && createdOrder?.adminNote && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="font-semibold text-lg mb-3">Observaciones del pedido</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{createdOrder.adminNote}</p>
                </div>
              )}

              {checkoutStage === "payment" && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <RiUploadCloudLine className="text-primary-500" /> Subir comprobante
                  </h2>
                  {selectedMethod && (
                    <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-col gap-4">
                        <div className="w-full max-w-[280px] mx-auto aspect-square rounded-3xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                          {selectedMethod.type === "QR" && selectedMethod.imageUrl ? (
                            <img src={selectedMethod.imageUrl} alt={selectedMethod.title} className="w-full h-full object-contain p-4" />
                          ) : (
                            <RiBankCardLine size={24} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">{paymentMethodLabel(selectedMethod)}</p>
                              <p className="text-xs uppercase tracking-widest text-gray-400">
                                {paymentMethodTypeLabel(selectedMethod)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{paymentMethodGuide(selectedMethod)}</p>
                          {selectedMethod.type === "BANK_ACCOUNT" && selectedMethod.accountNumber && (
                            <div className="mt-3 space-y-1 text-sm">
                              {selectedMethod.visibleLabel && <p><span className="text-gray-400">Titular:</span> <strong>{selectedMethod.visibleLabel}</strong></p>}
                              {selectedMethod.provider && <p><span className="text-gray-400">Banco / proveedor:</span> {selectedMethod.provider}</p>}
                              <p className="font-mono text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-2 inline-block">{selectedMethod.accountNumber}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProofChange(e.target.files?.[0] || undefined)}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label
                    htmlFor="proof-upload"
                    className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors mb-4 cursor-pointer ${proofPreview ? "border-primary-300 bg-primary-50" : "border-gray-200 hover:border-primary-400 hover:bg-primary-50"}`}
                  >
                    {proofPreview ? (
                      <img src={proofPreview} alt="Comprobante" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <>
                        <RiImageAddLine className="text-gray-300" size={40} />
                        <span className="text-sm font-medium text-gray-400">Subir imagen del comprobante</span>
                      </>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={uploadProof}
                    disabled={submittingProof || !proofFile || paymentMethods.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 rounded-full font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all"
                  >
                    {submittingProof ? "Subiendo..." : "Enviar comprobante"}
                    {!submittingProof && <RiArrowRightLine size={18} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header />
      <div className="pt-24 max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-semibold mb-8" style={{ fontFamily: "var(--font-cormorant),Georgia,serif" }}>Finalizar compra</h1>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-lg mb-5">Datos de entrega</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {[
                { name: "name", label: "Nombre completo", type: "text", ph: "Tu nombre" },
                { name: "phone", label: "Teléfono", type: "tel", ph: "300 000 0000" },
                { name: "email", label: "Email", type: "email", ph: "tu@email.com" },
                { name: "address", label: "Dirección de entrega", type: "text", ph: "Calle 123 #45-67" },
                { name: "addressRef", label: "Referencias (opcional)", type: "text", ph: "Apto 201, casa azul..." },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    {...register(f.name as keyof FormData)}
                    type={f.type}
                    placeholder={f.ph}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-400 text-sm"
                  />
                  {errors[f.name as keyof FormData] && (
                    <p className="text-red-500 text-xs mt-1">{errors[f.name as keyof FormData]?.message}</p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={creatingOrder || loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 rounded-full font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all mt-2"
              >
                {creatingOrder ? "Creando pedido..." : <><span>Crear pedido y ver métodos</span><RiArrowRightLine size={18} /></>}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <RiShoppingBagLine className="text-primary-500" /> Resumen
              </h2>
              <div className="space-y-3 mb-5">
                {orderItems.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image || ""} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                      {Array.isArray(item.flowers) && item.flowers.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          {item.flowers.map((flower: any) => `${flower.name} x${flower.quantity || 1}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-sm">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 text-sm text-emerald-700">
                <RiTimeLine size={15} /> <strong>{formatDeliveryLeadDays(cartDelivery.days)}</strong>
                <span className="text-emerald-600">· {cartDelivery.dateLabel}</span>
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><RiTruckLine size={14} /> Domicilio</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span><span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <RiShieldCheckLine size={14} /> Flujo de pago manual con comprobante
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
