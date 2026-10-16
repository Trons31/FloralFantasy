"use client";
import Link from "next/link";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/client/Header";
import { toOrderItemPayload, useBuyNowStore, useCartStore } from "@/store/cartStore";
import CartItemCardNote from "@/components/client/CartItemCardNote";
import { formatCustomerDeliveryDate, formatDeliveryDay, formatPrice, formatTime, formatTime12, getEffectiveDeliveryLeadDays, hasSameDayCutoffPassed } from "@/lib/utils";
import { isCancellablePendingOrder, pendingOrderExpiresAt } from "@/lib/pending-order";
import { useMinuteTick } from "@/lib/use-minute-tick";
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
  RiUploadCloudLine,
  RiCheckLine,
  RiAlertLine,
  RiLoaderLine,
  RiUser3Line,
  RiMapPin2Line,
  RiGiftLine,
  RiDeleteBinLine,
  RiLockLine,
  RiFileCopyLine,
  RiCloseCircleLine,
} from "react-icons/ri";
import PaymentProviderLogo from "@/components/ui/PaymentProviderLogo";
import { getPaymentProvider, uniqueProviders } from "@/lib/payment-providers";
import { toast } from "sonner";
import { DEFAULT_DELIVERY_FEE, DEFAULT_SAME_DAY_CUTOFF_TIME } from "@/lib/site-settings";
import { formatFlowerQuantityRange } from "@/lib/flower-quantities";

const schema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido"),
  address: z.string().min(5, "Dirección muy corta"),
  addressRef: z.string().optional(),
  cityId: z.string().min(1, "Selecciona una ciudad"),
  giftMessage: z.string().max(180, "El mensaje no puede superar 180 caracteres").optional(),
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
type City = { id: string; name: string; slug: string };

function paymentMethodLabel(method: PaymentMethod) {
  return method.visibleLabel || method.provider || method.title;
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

function getBouquetSummary(customization: any) {
  const baseFlowers = Array.isArray(customization?.baseFlowers) ? customization.baseFlowers : [];
  const extraFlowers = Array.isArray(customization?.extraFlowers) ? customization.extraFlowers : [];
  const sizeModes = customization?.sizeModes || {};
  const hasIncrease = Boolean(sizeModes.enlarged) || baseFlowers.some((flower: any) => (flower.quantity ?? 0) > (flower.baseQuantity ?? flower.quantity ?? 0));
  const hasDecrease = Boolean(sizeModes.reduced) || baseFlowers.some((flower: any) => (flower.quantity ?? 0) < (flower.baseQuantity ?? flower.quantity ?? 0));
  const hasExtras = extraFlowers.length > 0;
  const isMixed = ((hasIncrease || hasExtras) && hasDecrease) || (hasIncrease && hasExtras && hasDecrease);

  if (isMixed) return { label: "Mixto", detail: "flores aumentadas, reducidas y agregadas" };
  if (hasIncrease || hasExtras) {
    return {
      label: "Agrandado",
      detail: hasExtras
        ? `${extraFlowers.length} flor${extraFlowers.length !== 1 ? "es" : ""} extra`
        : "flores base aumentadas",
    };
  }
  if (hasDecrease) return { label: "Reducido", detail: "flores base reducidas" };
  return { label: "Normal", detail: "sin cambios" };
}

/** Estados en los que el pedido todavía espera que el cliente pague. */
const AWAITING_PAYMENT_STATUSES = ["PENDING", "PENDING_PAYMENT_CONFIRMATION", "PAYMENT_INVALID"];

function isAwaitingPayment(order: { status?: string; paymentProofUrl?: string | null }) {
  if (!AWAITING_PAYMENT_STATUSES.includes(order.status || "")) return false;
  // Con comprobante ya subido solo vuelve a esperar pago si lo rechazaron.
  return !order.paymentProofUrl || order.status === "PAYMENT_INVALID";
}

/**
 * Spec 013: si los arreglos ya traen su dedicatoria, el mensaje general del
 * pedido se ofrece como opción en lugar de pedirse de entrada.
 */
function PerItemMessagesNotice({ messages, total, onAddGeneral }: { messages: string[]; total: number; onAddGeneral: () => void }) {
  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/50 px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
        <RiCheckLine size={14} className="text-primary-500" />
        Tus dedicatorias ya van en cada arreglo ({messages.length} de {total})
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {messages.map((message, index) => (
          <li key={index} className="truncate text-[11px] italic text-slate-500">“{message}”</li>
        ))}
      </ul>
      <button type="button" onClick={onAddGeneral} className="mt-2 text-[11px] font-semibold text-primary-600 underline underline-offset-4 hover:text-primary-700">
        Agregar un mensaje general
      </button>
    </div>
  );
}

/**
 * Un paso del pago (spec 014). `locked`: aún no se puede hacer y no monta su
 * contenido, así no hay forma de subir un comprobante sin método.
 */
function PaymentStep({ number, title, state, children }: {
  number: number;
  title: string;
  state: "active" | "done" | "locked";
  children?: React.ReactNode;
}) {
  const locked = state === "locked";
  return (
    <section className={`rounded-2xl border p-4 ${locked ? "border-slate-100 bg-slate-50/60" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
            state === "done" ? "bg-primary-500 text-white" : locked ? "bg-slate-200 text-slate-400" : "bg-primary-50 text-primary-600"
          }`}
        >
          {state === "done" ? <RiCheckLine size={14} /> : number}
        </span>
        <h3 className={`text-[14px] font-bold ${locked ? "text-slate-400" : "text-slate-900"}`}>{title}</h3>
      </div>
      {locked ? (
        <p className="mt-1.5 pl-[38px] text-[11px] text-slate-400">Elige primero cómo pagar</p>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-400";

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutToken = searchParams.get("token") || "";
  const { items: cartItems, getTotalPrice, getDeliveryLeadDays, clearCart, updateQuantity, removeItem, pendingOrder, setPendingOrder, clearPendingOrder } = useCartStore();
  // “Comprar ahora” (spec 012): el checkout usa solo ese arreglo y el carrito
  // queda intacto.
  const buyNowItem = useBuyNowStore((state) => state.item);
  const setBuyNowQuantity = useBuyNowStore((state) => state.setQuantity);
  const clearBuyNow = useBuyNowStore((state) => state.clear);
  const buyNowMode = searchParams.get("mode") === "buy-now" && !checkoutToken && Boolean(buyNowItem);
  const items = buyNowMode && buyNowItem ? [buyNowItem] : cartItems;
  // Los textos de “entrega hoy / mañana” se recalculan cada minuto.
  useMinuteTick();
  const [loading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderDeliveryLeadDays, setOrderDeliveryLeadDays] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [sameDayCutoffTime, setSameDayCutoffTime] = useState(DEFAULT_SAME_DAY_CUTOFF_TIME);
  const [loadingLink, setLoadingLink] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerAddressRef, setCustomerAddressRef] = useState("");
  const [customerCityId, setCustomerCityId] = useState("");
  const [customerGiftMessage, setCustomerGiftMessage] = useState("");
  const [checkoutStage, setCheckoutStage] = useState<"details" | "payment">("details");
  const orderAdjustment = typeof createdOrder?.manualAdjustment === "number" ? createdOrder.manualAdjustment : 0;
  const orderStatus = createdOrder?.status || "";
  const paymentStateMessage =
    orderStatus === "PAID"
      ? "Pago validado por el equipo"
      : orderStatus === "PAYMENT_INVALID"
        ? "Pago rechazado, revisa el comprobante"
        : createdOrder?.paymentProofUrl
          ? "Esperando validación del pago"
          : "Esperando tu comprobante";
  // Spec 017: el pedido del cliente sin comprobante se puede cancelar y vence en 1 h.
  const canCancelOrder = Boolean(createdOrder && isCancellablePendingOrder({ status: orderStatus, paymentProofUrl: createdOrder.paymentProofUrl || null }));
  const orderExpiresLabel = canCancelOrder && createdOrder?.createdAt ? formatTime(pendingOrderExpiresAt(createdOrder.createdAt)) : "";
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const cancelOrder = async () => {
    if (!createdOrder) return;
    setCancellingOrder(true);
    try {
      const res = await fetch(`/api/orders/${createdOrder.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingToken: createdOrder.trackingToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No fue posible cancelar el pedido");
      if (useCartStore.getState().pendingOrder?.trackingToken === createdOrder.trackingToken) useCartStore.getState().clearPendingOrder();
      toast.success("Pedido cancelado");
      router.replace("/flores");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cancelar el pedido");
      setCancellingOrder(false);
    }
  };

  const subtotal = buyNowMode && buyNowItem ? buyNowItem.subtotal : getTotalPrice();
  const total = subtotal + deliveryFee;
  const cartDelivery = useMemo(() => {
    if (!(buyNowMode && buyNowItem)) return getDeliveryLeadDays(sameDayCutoffTime);
    const days = getEffectiveDeliveryLeadDays(buyNowItem.deliveryLeadDays || 0, sameDayCutoffTime);
    return { days, label: formatCustomerDeliveryDate(days) };
  }, [buyNowMode, buyNowItem, getDeliveryLeadDays, sameDayCutoffTime, cartItems]); // eslint-disable-line react-hooks/exhaustive-deps
  const changeQuantity = (id: string, qty: number) => {
    if (buyNowMode) setBuyNowQuantity(qty);
    else updateQuantity(id, qty);
  };
  const removeLine = (id: string) => {
    if (buyNowMode) {
      clearBuyNow();
      router.back();
    } else {
      removeItem(id);
    }
  };
  const cutoffPassed = hasSameDayCutoffPassed(sameDayCutoffTime);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Spec 013: el mensaje general se muestra solo si ningún arreglo trae
  // dedicatoria, si el cliente lo pide o si ya escribió algo.
  const [showGeneralMessage, setShowGeneralMessage] = useState(false);
  const itemMessages = items.map(item => (item.card?.message || item.message || "").trim()).filter(Boolean);
  const showGiftMessageField = !itemMessages.length || showGeneralMessage || Boolean(watch("giftMessage")?.trim());
  const linkItemMessages = orderItems.map(item => String(item.cardMessage || "").trim()).filter(Boolean);
  const showLinkGiftMessageField = !linkItemMessages.length || showGeneralMessage || Boolean(customerGiftMessage.trim());

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === selectedMethodId) || null,
    [paymentMethods, selectedMethodId]
  );
  const acceptedProviders = useMemo(() => uniqueProviders(paymentMethods), [paymentMethods]);
  const [copied, setCopied] = useState(false);
  const payStepRef = useRef<HTMLDivElement>(null);

  // Spec 014: con un solo método no hay nada que elegir.
  useEffect(() => {
    if (paymentMethods.length === 1 && !selectedMethodId) setSelectedMethodId(paymentMethods[0].id);
  }, [paymentMethods, selectedMethodId]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.deliveryFee === "number") setDeliveryFee(data.deliveryFee);
        if (typeof data?.sameDayCutoffTime === "string") setSameDayCutoffTime(data.sameDayCutoffTime);
      })
      .catch(() => {});
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((data) => {
        setPaymentMethods(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => {
        const activeCities = Array.isArray(data) ? data : [];
        setCities(activeCities);
        if (activeCities.length === 1) {
          setCustomerCityId(activeCities[0].id);
          setValue("cityId", activeCities[0].id, { shouldValidate: true });
        }
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
        const isOwnPending = useCartStore.getState().pendingOrder?.trackingToken === order.trackingToken;
        if (!isAwaitingPayment(order)) {
          // Ya tiene comprobante, está pagado o cancelado: nada que retomar.
          if (isOwnPending) clearPendingOrder();
          // Spec 017: cancelado (por el cliente o por vencer) → el seguimiento lo explica.
          if (order.status === "CANCELLED") {
            router.replace(`/seguimiento?token=${order.trackingToken}`);
            return;
          }
          if (order.paymentProofUrl && order.status !== "PAYMENT_INVALID") {
            router.replace(`/checkout/confirmacion?token=${order.trackingToken}`);
            return;
          }
        }
        const orderDeliveryDays = Array.isArray(order.items)
          ? order.items.reduce((max: number, item: any) => Math.max(max, getEffectiveDeliveryLeadDays(item.product?.deliveryLeadDays || 0, sameDayCutoffTime)), 0)
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
                quantityMin: pf.quantityMin || pf.quantity || 1,
                quantityMax: pf.quantityMax || pf.quantity || 1,
              }))
            : [],
          customization: item.customization || null,
          cardMessage: item.cardMessage || null,
          deliveryLeadDays: item.product?.deliveryLeadDays || 0,
          subtotal: (item.price + (item.addons || []).reduce((sum: number, a: any) => sum + (a.price || 0), 0) + (item.cardPrice || 0)) * item.quantity,
        })) : []);
        setOrderTotal(typeof order.total === "number" ? order.total : 0);
        setOrderDeliveryLeadDays(orderDeliveryDays);
        setCustomerName(order.customerName || "");
        setCustomerPhone(order.customerPhone || "");
        setCustomerEmail(order.customerEmail || "");
        setCustomerAddress(order.address || "");
        setCustomerAddressRef(order.addressRef || "");
        setCustomerCityId(order.cityId || "");
        setCustomerGiftMessage(order.giftMessage || "");
        // Un pedido que el propio cliente creó ya tiene sus datos: al
        // retomarlo va directo al pago. Un enlace armado por el equipo pasa
        // primero por “Completa tus datos”.
        const hasDetails = Boolean(order.customerName && order.customerPhone && order.address && order.cityId);
        setCheckoutStage(isOwnPending && hasDetails ? "payment" : "details");
      })
      .catch(() => {
        if (useCartStore.getState().pendingOrder?.trackingToken === checkoutToken) clearPendingOrder();
      })
      .finally(() => setLoadingLink(false));
  }, [checkoutToken, sameDayCutoffTime, clearPendingOrder, router]);

  // Sin token y con el carrito vacío: si hay un pedido sin pagar, se retoma.
  const shouldResumePending = !checkoutToken && !createdOrder && !items.length && Boolean(pendingOrder);
  useEffect(() => {
    if (shouldResumePending && pendingOrder) router.replace(`/checkout?token=${pendingOrder.trackingToken}`);
  }, [shouldResumePending, pendingOrder, router]);

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
        body: JSON.stringify({ ...data, items: items.map(toOrderItemPayload), total, deliveryFee, estimatedTime: cartDelivery.label }),
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
      // El servidor calcula el total con los precios vigentes (spec 012).
      const confirmedTotal = typeof order.total === "number" ? order.total : total;
      setOrderTotal(confirmedTotal);
      setOrderDeliveryLeadDays(cartDelivery.days);
      setCustomerName(data.name);
      setCustomerPhone(data.phone);
      setCustomerEmail(data.email);
      setCustomerAddress(data.address);
      setCustomerAddressRef(data.addressRef || "");
      setCustomerCityId(data.cityId);
      setCheckoutStage("payment");
      // El pedido ya existe en el servidor: se guarda para poder retomarlo
      // y la URL lleva el token, así recargar no lo pierde (spec 005).
      setPendingOrder({ id: order.id, trackingToken: order.trackingToken, total: confirmedTotal, createdAt: order.createdAt || new Date().toISOString() });
      if (buyNowMode) clearBuyNow();
      else clearCart();
      router.replace(`/checkout?token=${order.trackingToken}`, { scroll: false });
      toast.success("Pedido creado. Ahora sube tu comprobante.");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  async function optimizeProofFile(file: File) {
    if (!file.type.startsWith("image/")) return file;
    if (file.size <= 1.5 * 1024 * 1024) return file;

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });

      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(image, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), "image/jpeg", 0.82);
      });

      if (!blob) return file;
      const safeName = file.name.replace(/\.[^.]+$/, "") || "comprobante";
      return new File([blob], `${safeName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const handleProofChange = async (file?: File) => {
    if (!file) return;
    if (!selectedMethod) {
      toast.error("Selecciona primero un método de pago");
      return;
    }
    try {
      const optimized = await optimizeProofFile(file);
      setProofFile(optimized);
      setProofPreview(URL.createObjectURL(optimized));
    } catch {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const selectPaymentMethod = (methodId: string) => {
    if (selectedMethodId !== methodId && proofPreview) URL.revokeObjectURL(proofPreview);
    if (selectedMethodId !== methodId) {
      setProofFile(null);
      setProofPreview(null);
    }
    setSelectedMethodId(methodId);
    setCopied(false);
    // En móvil el paso 2 queda debajo de la lista: se lleva a la vista.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => payStepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const clearPaymentMethod = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setSelectedMethodId("");
    setProofFile(null);
    setProofPreview(null);
    setCopied(false);
  };

  const copyAccount = async (value: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        // Sin portapapeles moderno (http, navegadores viejos): copia clásica.
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand("copy");
        field.remove();
        if (!ok) throw new Error("copy failed");
      }
      setCopied(true);
      toast.success("Copiado");
    } catch {
      toast.error("No se pudo copiar, cópialo manualmente");
    }
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
      fd.append("cityId", customerCityId);
      fd.append("giftMessage", customerGiftMessage);
      if (selectedMethod?.id) fd.append("paymentMethodId", selectedMethod.id);

      const res = await fetch(`/api/orders/${createdOrder.id}/payment-proof`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible cargar el comprobante");

      toast.success("Comprobante cargado correctamente");
      clearPendingOrder();
      router.push(`/checkout/confirmacion?token=${createdOrder.trackingToken}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const canContinueToPayment = Boolean(customerName.trim() && customerPhone.trim() && customerAddress.trim() && customerCityId);

  if ((checkoutToken && loadingLink && !createdOrder) || shouldResumePending) {
    return (
      <main className="min-h-screen bg-[#fdfcf8]">
        <Header />
        {/* Centrado en la pantalla visible; la cabecera es fija (pt-20 la compensa). */}
        <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-20 text-center">
          <div className="mb-4 flex justify-center text-primary-200"><RiLoaderLine size={48} className="animate-spin" /></div>
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-slate-900">Cargando tu pedido</h2>
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
          <Link href="/flores" className="bg-primary-600 text-white px-8 py-3 rounded-full inline-block hover:bg-primary-700 transition-colors">Ver catálogo</Link>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main className="min-h-screen bg-[#fdfcf8]">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-6 pt-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.95fr)]">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                  <RiCheckLine size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-950" style={{ fontFamily: "var(--font-cormorant),Georgia,serif" }}>
                    {checkoutToken ? "Completa tu pedido" : "Pedido creado"}
                  </h1>
                  <p className="text-xs leading-5 text-slate-500 sm:text-sm">
                    {checkoutToken
                      ? "Completa tus datos, elige un método de pago y sube el comprobante."
                      : "Elige un método de pago, realiza el pago y sube el comprobante para validar tu pedido."}
                  </p>
                </div>
              </div>

              {checkoutStage === "details" && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Paso 1</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Completa tus datos</p>
                  <div className="mt-3 grid gap-3">
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nombre completo" className={inputCls} />
                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Teléfono" className={inputCls} />
                    <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Correo electrónico" className={inputCls} />
                    <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Dirección de entrega" className={inputCls} />
                    <input value={customerAddressRef} onChange={e => setCustomerAddressRef(e.target.value)} placeholder="Referencia (opcional)" className={inputCls} />
                    <select value={customerCityId} onChange={e => setCustomerCityId(e.target.value)} className={`${inputCls} bg-white`}>
                      <option value="">Selecciona tu ciudad</option>
                      {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                    </select>
                    {showLinkGiftMessageField ? (
                      <div>
                        <textarea
                          value={customerGiftMessage}
                          onChange={e => setCustomerGiftMessage(e.target.value)}
                          maxLength={180}
                          rows={3}
                          placeholder={linkItemMessages.length ? "Mensaje general para el pedido (opcional)" : "Mensaje para la tarjeta (opcional)"}
                          className={`${inputCls} resize-none`}
                        />
                        {linkItemMessages.length > 0 && (
                          <button type="button" onClick={() => { setCustomerGiftMessage(""); setShowGeneralMessage(false); }} className="mt-1 text-[11px] font-medium text-slate-500 underline underline-offset-4 hover:text-primary-600">
                            Quitar mensaje general
                          </button>
                        )}
                      </div>
                    ) : (
                      <PerItemMessagesNotice messages={linkItemMessages} total={orderItems.length} onAddGeneral={() => setShowGeneralMessage(true)} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => canContinueToPayment ? setCheckoutStage("payment") : toast.error("Completa nombre, teléfono, dirección y ciudad para continuar")}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    Continuar al pago <RiArrowRightLine size={16} />
                  </button>
                </div>
              )}

              {checkoutStage === "payment" && (
                <div className="space-y-3">
                  {/* Spec 014: elige → paga → sube, en ese orden y en una sola tarjeta. */}
                  <PaymentStep number={1} title="Elige cómo pagar" state={selectedMethod ? "done" : "active"}>
                    {paymentMethods.length === 0 ? (
                      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        <RiAlertLine className="mt-0.5 flex-shrink-0" />
                        <span>No hay métodos de pago activos configurados. Por favor contacta al administrador.</span>
                      </div>
                    ) : selectedMethod ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50/40 p-3">
                        <PaymentProviderLogo provider={selectedMethod.provider || selectedMethod.title} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-slate-900">{paymentMethodLabel(selectedMethod)}</p>
                          {selectedMethod.provider && <p className="mt-0.5 truncate text-[11px] text-slate-500">{selectedMethod.provider}</p>}
                        </div>
                        {paymentMethods.length > 1 && (
                          <button type="button" onClick={clearPaymentMethod} className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary-600 hover:bg-primary-50 hover:text-primary-700">
                            Cambiar
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods.map(method => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => selectPaymentMethod(method.id)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-primary-300 hover:bg-primary-50/30"
                          >
                            <PaymentProviderLogo provider={method.provider || method.title} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-slate-900">{paymentMethodLabel(method)}</p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                {[method.provider, method.type === "QR" ? "Pago con QR" : method.type === "BANK_ACCOUNT" ? "Transferencia" : ""].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <RiArrowRightLine size={16} className="shrink-0 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </PaymentStep>

                  <div ref={payStepRef} className="scroll-mt-24">
                    <PaymentStep number={2} title={`Paga ${formatPrice(orderTotal)}`} state={selectedMethod ? "active" : "locked"}>
                      {selectedMethod && (
                        <div className="space-y-3">
                          {selectedMethod.accountNumber && (
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  {getPaymentProvider(selectedMethod.provider || selectedMethod.title)?.accountLabel || "Número o cuenta"}
                                </p>
                                <p className="mt-0.5 break-all font-mono text-[15px] font-bold text-slate-900">{selectedMethod.accountNumber}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyAccount(selectedMethod.accountNumber || "")}
                                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-semibold transition ${copied ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600"}`}
                              >
                                {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
                                {copied ? "Copiado" : "Copiar"}
                              </button>
                            </div>
                          )}
                          {selectedMethod.type === "QR" && selectedMethod.imageUrl && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                              <img
                                src={selectedMethod.imageUrl}
                                alt={`QR de ${paymentMethodLabel(selectedMethod)}`}
                                className="mx-auto h-44 w-44 rounded-xl object-contain"
                              />
                              <p className="mt-2 text-[11px] text-slate-500">Escanea el código desde tu app</p>
                            </div>
                          )}
                          <p className="whitespace-pre-line text-[12px] leading-5 text-slate-600">{paymentMethodGuide(selectedMethod)}</p>
                        </div>
                      )}
                    </PaymentStep>
                  </div>

                  <PaymentStep number={3} title="Sube tu comprobante" state={selectedMethod ? (proofFile ? "done" : "active") : "locked"}>
                    {selectedMethod && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleProofChange(e.target.files?.[0] || undefined)}
                          className="hidden"
                          id="proof-upload"
                        />
                        <label
                          htmlFor="proof-upload"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleProofChange(event.dataTransfer.files?.[0]);
                          }}
                          className={`flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
                            proofPreview
                              ? "border-primary-300 bg-primary-50"
                              : "border-primary-200 bg-primary-50/30 hover:border-primary-400 hover:bg-primary-50"
                          }`}
                        >
                          {proofPreview ? (
                            <img src={proofPreview} alt="Comprobante" className="h-full w-full object-contain p-2" />
                          ) : (
                            <>
                              <RiUploadCloudLine className="text-slate-700" size={34} />
                              <span className="mt-1 text-[13px] font-bold text-slate-800">Toca para subir la captura de tu pago</span>
                              <span className="text-[11px] text-slate-500">o arrastra la imagen aquí</span>
                              <span className="mt-2 text-[9px] text-slate-400">JPG, PNG o WEBP · Máx. 12 MB</span>
                            </>
                          )}
                        </label>
                        {proofPreview && (
                          <label htmlFor="proof-upload" className="mt-2 block cursor-pointer text-center text-[11px] font-semibold text-primary-600 hover:text-primary-700">
                            Cambiar imagen
                          </label>
                        )}
                        <p className="mt-2 text-center text-[10px] text-slate-400">Que se vean completos el valor, la fecha y la referencia.</p>

                        <button
                          type="button"
                          onClick={uploadProof}
                          disabled={submittingProof || !proofFile}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-[13px] font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {submittingProof ? "Finalizando..." : "Finalizar pedido"}
                          {!submittingProof && <RiArrowRightLine size={16} />}
                        </button>
                      </>
                    )}
                  </PaymentStep>

                  <p className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                    <RiLockLine size={11} /> Pago 100% seguro y protegido
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="order-2 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
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
                            {getBouquetSummary(item.customization).label}
                            {getBouquetSummary(item.customization).detail !== "sin cambios"
                              ? ` · ${getBouquetSummary(item.customization).detail}`
                              : ""}
                          </p>
                        )}
                        {Array.isArray(item.customization?.baseFlowers) && item.customization.baseFlowers.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {item.customization.baseFlowers
                              .map((flower: any) => `${flower.name} x${formatFlowerQuantityRange(flower)}`)
                              .join(", ")}
                          </p>
                        )}
                        {Array.isArray(item.flowers) && item.flowers.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {item.flowers.map((flower: any) => `${flower.name} x${formatFlowerQuantityRange(flower)}`).join(", ")}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-sm">{formatPrice(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <p className="mb-4 flex items-center gap-1.5 text-[12px] text-slate-500">
                  <RiTimeLine size={14} className="shrink-0" />
                  {/* La fecha se fijó al crear el pedido; recalcularla con la
                      hora actual la movería si el cliente vuelve más tarde. */}
                  <span>{createdOrder.estimatedTime || formatCustomerDeliveryDate(orderDeliveryLeadDays)}</span>
                </p>
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1.5"><RiTruckLine size={14} /> Domicilio</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
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
                {canCancelOrder && (
                  <div className="mt-5 space-y-3">
                    {orderExpiresLabel && (
                      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-amber-600">
                          <RiTimeLine size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-amber-900">Tienes hasta las {orderExpiresLabel}</p>
                          <p className="mt-0.5 text-[13px] leading-5 text-amber-800">Si no subes el comprobante antes, el pedido se cancela solo.</p>
                        </div>
                      </div>
                    )}
                    {confirmCancelOrder ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5">
                        <p className="text-sm font-semibold text-red-800">¿Seguro que quieres cancelar este pedido?</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setConfirmCancelOrder(false)} disabled={cancellingOrder} className="h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
                            No, seguir
                          </button>
                          <button type="button" onClick={cancelOrder} disabled={cancellingOrder} className="h-10 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                            {cancellingOrder ? "Cancelando…" : "Sí, cancelar"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmCancelOrder(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50">
                        <RiCloseCircleLine size={17} /> Cancelar pedido
                      </button>
                    )}
                  </div>
                )}
              </div>

              {checkoutToken && createdOrder?.adminNote && (
                <div className="order-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="font-semibold text-lg mb-3">Observaciones del pedido</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{createdOrder.adminNote}</p>
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
      <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-primary-200 hover:text-primary-500"
            aria-label="Volver"
          >
            <RiArrowRightLine size={15} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-[26px] font-semibold leading-none tracking-tight text-slate-950 sm:text-[28px]" style={{ fontFamily: "var(--font-cormorant),Georgia,serif" }}>Finalizar compra</h1>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <RiShieldCheckLine size={12} className="text-primary-500" />
              {buyNowMode && buyNowItem ? `Comprando: ${buyNowItem.name} · tu carrito se guarda para después` : "Compra segura y protegida"}
            </p>
          </div>
        </div>

        {pendingOrder && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-amber-600 shadow-sm"><RiTimeLine size={17} /></span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-900">Tienes un pedido pendiente de pago</p>
                <p className="mt-0.5 text-xs leading-5 text-amber-800">
                  #{pendingOrder.trackingToken} · {formatPrice(pendingOrder.total)}. Puedes completar ese pago o seguir con esta compra nueva.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button type="button" onClick={clearPendingOrder} className="h-10 rounded-xl border border-amber-200 bg-white px-4 text-xs font-semibold text-amber-800 transition hover:bg-amber-100">
                Seguir con esta compra
              </button>
              <Link href={`/checkout?token=${pendingOrder.trackingToken}`} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-xs font-bold text-white transition hover:bg-amber-600">
                Completar pago pendiente <RiArrowRightLine size={14} />
              </Link>
            </div>
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_430px]">
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.045)] sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-500"><RiUser3Line size={15} /></span>
              <h2 className="text-[14px] font-bold text-slate-900">1. Datos de entrega</h2>
            </div>
            <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
              {[
                { name: "name", label: "Nombre completo", type: "text", ph: "Tu nombre" },
                { name: "phone", label: "Teléfono", type: "tel", ph: "300 000 0000" },
                { name: "email", label: "Email", type: "email", ph: "tu@email.com" },
                { name: "address", label: "Dirección de entrega", type: "text", ph: "Calle 123 #45-67" },
                { name: "addressRef", label: "Referencias (opcional)", type: "text", ph: "Apto 201, casa azul..." },
              ].filter(f => ["name", "phone", "email"].includes(f.name)).map(f => (
                <div key={f.name}>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">{f.label}</label>
                  <input
                    {...register(f.name as keyof FormData)}
                    type={f.type}
                    placeholder={f.ph}
                    className={inputCls}
                  />
                  {errors[f.name as keyof FormData] && (
                    <p className="mt-1 text-[10px] text-red-500">{errors[f.name as keyof FormData]?.message}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Confirmar email (opcional)</label>
                <input type="email" placeholder="tu@email.com" className={inputCls} />
              </div>
            </div>

            <section className="mt-5 border-t border-slate-100 pt-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-500"><RiMapPin2Line size={15} /></span>
                <h2 className="text-[14px] font-bold text-slate-900">2. Dirección de entrega</h2>
              </div>
              <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Dirección</label>
                  <div className="relative">
                    <input {...register("address")} type="text" placeholder="Calle 123 #45-67, Apto 201" className={`${inputCls} pr-10`} />
                    <RiMapPin2Line className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary-500" size={15} />
                  </div>
                  {errors.address && <p className="mt-1 text-[10px] text-red-500">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Ciudad</label>
                  <select {...register("cityId")} className={`${inputCls} bg-white`}>
                    <option value="">Selecciona tu ciudad</option>
                    {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </select>
                  {errors.cityId && <p className="mt-1 text-[10px] text-red-500">{errors.cityId.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Referencia (opcional)</label>
                  <input {...register("addressRef")} type="text" placeholder="Apto 201, casa azul, portería..." className={inputCls} />
                </div>
              </div>
            </section>

            <section className="mt-5 border-t border-slate-100 pt-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-500"><RiGiftLine size={15} /></span>
                <h2 className="text-[14px] font-bold text-slate-900">3. Mensaje para la tarjeta (opcional)</h2>
              </div>
              {showGiftMessageField ? (
                <>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    {itemMessages.length ? "Mensaje general para todo el pedido" : "Escribe un mensaje especial para acompañar tu regalo"}
                  </label>
                  <textarea
                    {...register("giftMessage")}
                    maxLength={180}
                    rows={3}
                    placeholder="Ej: Feliz aniversario amor, gracias por todo..."
                    className={`${inputCls} min-h-[72px] resize-none`}
                  />
                  {errors.giftMessage && <p className="mt-1 text-[10px] text-red-500">{errors.giftMessage.message}</p>}
                  <div className="mt-1 flex items-center justify-between gap-2">
                    {itemMessages.length > 0 ? (
                      <button type="button" onClick={() => { setValue("giftMessage", ""); setShowGeneralMessage(false); }} className="text-[11px] font-medium text-slate-500 underline underline-offset-4 hover:text-primary-600">
                        Quitar mensaje general
                      </button>
                    ) : <span />}
                    <p className="text-right text-[10px] text-slate-400">Máximo 180 caracteres</p>
                  </div>
                </>
              ) : (
                <PerItemMessagesNotice messages={itemMessages} total={items.length} onAddGeneral={() => setShowGeneralMessage(true)} />
              )}
            </section>

              <button
                type="submit"
                disabled={creatingOrder || loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-[13px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
              >
                {creatingOrder ? "Creando pedido..." : <><span>Continuar con el pedido</span><RiArrowRightLine size={15} /></>}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400"><RiLockLine size={11} /> Tus datos están 100% protegidos</p>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.045)] sm:p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-slate-900">
                <RiShoppingBagLine className="text-primary-500" size={17} /> Tu pedido
              </h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <img src={item.image || ""} alt={item.name} className="h-[88px] w-[88px] rounded-xl object-cover" />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-slate-900">{item.name}</p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <RiTimeLine size={12} /> Entrega {formatDeliveryDay(getEffectiveDeliveryLeadDays(item.deliveryLeadDays || 0, sameDayCutoffTime))}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(item.id)}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary-100 text-primary-500 transition hover:bg-primary-50"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <RiDeleteBinLine size={14} />
                        </button>
                      </div>
                      <CartItemCardNote item={item} />
                      <p className="mt-2 text-[17px] font-bold text-primary-600">{formatPrice(item.subtotal)}</p>
                      <div className="mt-2 inline-flex h-9 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <button type="button" onClick={() => changeQuantity(item.id, Math.max(buyNowMode ? 1 : 0, item.quantity - 1))} className="h-full w-9 text-sm text-slate-400 hover:bg-slate-50" aria-label="Reducir cantidad">-</button>
                        <span className="flex h-full w-9 items-center justify-center border-x border-slate-200 text-xs font-semibold text-slate-900">{item.quantity}</span>
                        <button type="button" onClick={() => changeQuantity(item.id, item.quantity + 1)} className="h-full w-9 text-sm text-primary-500 hover:bg-primary-50" aria-label="Aumentar cantidad">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-[12px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1.5"><RiTruckLine size={12} /> Domicilio</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-primary-50/70 px-3 py-2.5 text-[15px] font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                {[
                  // Spec 014: el día real del pedido, no “entrega hoy” genérico.
                  cartDelivery.days <= 0
                    ? ["Entrega hoy", `Pide antes de las ${formatTime12(sameDayCutoffTime)}`]
                    : [`Entrega ${formatDeliveryDay(cartDelivery.days)}`, cartDelivery.days === 1 && cutoffPassed ? "Pide hoy y lo recibes mañana" : "Preparamos tu arreglo con tiempo"],
                  ["Pago 100% seguro", "Protegemos tu información"],
                  ["Garantía de satisfacción", "Te acompañamos durante todo el proceso"],
                ].map(([title, description]) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500"><RiShieldCheckLine size={13} /></span>
                    <div>
                      <p className="text-[10px] font-bold text-slate-800">{title}</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {acceptedProviders.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-center text-[10px] font-medium text-slate-500">Aceptamos estos medios de pago</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {acceptedProviders.map(provider => (
                      <PaymentProviderLogo key={provider.id} provider={provider.id} size="sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
