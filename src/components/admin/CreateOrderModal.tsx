"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiUser3Line,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiSearchLine,
  RiAddLine,
  RiSubtractLine,
  RiShoppingBagLine,
  RiWhatsappLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiLoaderLine,
} from "react-icons/ri";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductImage { url: string; isMain: boolean }
interface Addon { id: string; name: string; price: number; type: string; inStock: boolean }
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: ProductImage[];
  occasion?: string;
}
interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  addons: Addon[];
}
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (order: any) => void; // recibe el pedido completo para inserción optimista
}

const ESTIMATED_OPTIONS = ["1 dia", "2 dias", "3 dias", "Hoy mismo", "2 horas", "4 horas"];
const DELIVERY_FEE_DEFAULT = 8000;

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateOrderModal({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Customer data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [addressRef, setAddressRef] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(DELIVERY_FEE_DEFAULT);
  const [estimatedTime, setEstimatedTime] = useState("1 dia");

  // Products / cart
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0); setName(""); setPhone(""); setEmail("");
        setAddress(""); setAddressRef(""); setDeliveryFee(DELIVERY_FEE_DEFAULT);
        setEstimatedTime("1 dia"); setCart([]); setSearch("");
        setSuccess(false); setError("");
      }, 300);
    }
  }, [open]);

  // Load products & addons when reaching step 1
  useEffect(() => {
    if (open && step === 1 && products.length === 0) {
      setLoadingProducts(true);
      Promise.all([
        fetch("/api/products").then(r => r.json()),
        fetch("/api/addons").then(r => r.json()),
      ])
        .then(([prods, ads]) => {
          setProducts(Array.isArray(prods) ? prods : (prods.products ?? []));
          setAddons(Array.isArray(ads) ? ads : (ads.addons ?? []));
        })
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    }
  }, [open, step, products.length]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.occasion ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1, price: product.price, addons: [] }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c => c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c)
        .filter(c => c.quantity > 0)
    );
  };

  const toggleAddon = (productId: string, addon: Addon) => {
    setCart(prev =>
      prev.map(c => {
        if (c.product.id !== productId) return c;
        const has = c.addons.find(a => a.id === addon.id);
        return { ...c, addons: has ? c.addons.filter(a => a.id !== addon.id) : [...c.addons, addon] };
      })
    );
  };

  const subtotal = cart.reduce(
    (acc, c) => acc + c.price * c.quantity + c.addons.reduce((a, ad) => a + ad.price, 0) * c.quantity,
    0
  );
  const total = subtotal + deliveryFee;

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          address,
          addressRef,
          total,
          deliveryFee,
          estimatedTime,
          source: "ADMIN",
          items: cart.map(c => ({
            productId: c.product.id,
            quantity: c.quantity,
            price: c.price,
            addons: c.addons,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear pedido");
      setSuccess(true);
      onCreated?.(data); // ← pasa el pedido completo (con items incluidos) para inserción optimista
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const step0Valid = !!(name.trim() && phone.trim() && address.trim());
  const step1Valid = cart.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto md:max-w-2xl md:max-h-[90vh] md:rounded-2xl
                       z-50 bg-white rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
            style={{ maxHeight: "92dvh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <RiWhatsappLine className="text-green-500" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Nuevo pedido</h2>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Pedido recibido por WhatsApp u otro canal</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <RiCloseLine size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Progress */}
            {!success && (
              <div className="flex gap-1 px-5 pt-3 pb-2 flex-shrink-0">
                {["Cliente", "Productos", "Resumen"].map((label, i) => (
                  <div key={i} className="flex-1">
                    <div className={`h-1 rounded-full transition-all duration-300 ${i <= step ? "bg-rose-500" : "bg-gray-200"}`} />
                    <p className={`text-[10px] mt-1 font-medium ${i === step ? "text-rose-500" : i < step ? "text-gray-500" : "text-gray-300"}`}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <AnimatePresence mode="wait">

                {/* SUCCESS */}
                {success && (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <RiCheckboxCircleLine size={44} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">¡Pedido registrado!</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                      El pedido de <strong>{name}</strong> fue ingresado al sistema y ya aparece en el tablero.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-2 px-8 py-3 bg-rose-500 text-white rounded-xl font-semibold text-sm hover:bg-rose-600 transition-colors"
                    >
                      Cerrar
                    </button>
                  </motion.div>
                )}

                {/* STEP 0 — Cliente */}
                {!success && step === 0 && (
                  <motion.div key="step0"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="px-5 py-4 space-y-4"
                  >
                    <Field icon={<RiUser3Line />} label="Nombre completo *">
                      <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Ej: María García"
                        className={inputCls}
                      />
                    </Field>

                    <Field icon={<RiPhoneLine />} label="Teléfono / WhatsApp *">
                      <input
                        value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+57 300 000 0000" type="tel"
                        className={inputCls}
                      />
                    </Field>

                    <Field icon={<RiMailLine />} label="Correo electrónico">
                      <input
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="cliente@email.com (opcional)" type="email"
                        className={inputCls}
                      />
                    </Field>

                    <Field icon={<RiMapPinLine />} label="Dirección de entrega *">
                      <input
                        value={address} onChange={e => setAddress(e.target.value)}
                        placeholder="Calle 10 # 5-23, Neiva"
                        className={inputCls}
                      />
                    </Field>

                    <Field icon={<RiMapPinLine />} label="Referencia / indicaciones">
                      <input
                        value={addressRef} onChange={e => setAddressRef(e.target.value)}
                        placeholder="Casa blanca, portón azul…"
                        className={inputCls}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field icon={<RiTimeLine />} label="Tiempo estimado">
                        <select value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} className={inputCls}>
                          {ESTIMATED_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </Field>
                      <Field icon={<RiShoppingBagLine />} label="Domicilio (COP)">
                        <input
                          value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))}
                          type="number" min={0} step={1000}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1 — Productos */}
                {!success && step === 1 && (
                  <motion.div key="step1"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col"
                  >
                    <div className="px-5 pt-4 pb-2 flex-shrink-0">
                      <div className="relative">
                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          value={search} onChange={e => setSearch(e.target.value)}
                          placeholder="Buscar productos…"
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-rose-400"
                        />
                      </div>
                    </div>

                    <div className="px-5 pb-2 space-y-2">
                      {loadingProducts ? (
                        <div className="flex items-center justify-center py-12">
                          <RiLoaderLine size={28} className="text-rose-400 animate-spin" />
                        </div>
                      ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-10">Sin resultados</p>
                      ) : (
                        filtered.map(product => {
                          const cartItem = cart.find(c => c.product.id === product.id);
                          const img = product.images?.find(i => i.isMain)?.url ?? product.images?.[0]?.url;
                          return (
                            <div key={product.id}
                              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-rose-200 transition-colors bg-white"
                            >
                              {img ? (
                                <img src={img} alt={product.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                              ) : (
                                <div className="w-14 h-14 bg-rose-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                                  <RiShoppingBagLine className="text-rose-300" size={22} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{product.name}</p>
                                {product.occasion && (
                                  <p className="text-[10px] text-rose-400 uppercase font-bold tracking-wide">{product.occasion}</p>
                                )}
                                <p className="text-rose-600 font-bold text-sm mt-0.5">{fmt(product.price)}</p>
                              </div>
                              {cartItem ? (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button onClick={() => updateQty(product.id, -1)}
                                    className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center hover:bg-rose-200 transition-colors">
                                    <RiSubtractLine size={14} className="text-rose-600" />
                                  </button>
                                  <span className="w-5 text-center text-sm font-bold text-gray-900">{cartItem.quantity}</span>
                                  <button onClick={() => updateQty(product.id, 1)}
                                    className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors">
                                    <RiAddLine size={14} className="text-white" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => addToCart(product)}
                                  className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200">
                                  <RiAddLine size={18} className="text-white" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Complementos por producto en carrito */}
                    {cart.length > 0 && addons.length > 0 && (
                      <div className="px-5 pt-3 pb-2 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Complementos por producto</p>
                        <div className="space-y-3">
                          {cart.map(c => (
                            <div key={c.product.id}>
                              <p className="text-xs font-semibold text-gray-700 mb-1.5">{c.product.name}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {addons.filter(a => a.inStock).map(addon => {
                                  const selected = c.addons.find(a => a.id === addon.id);
                                  return (
                                    <button key={addon.id} onClick={() => toggleAddon(c.product.id, addon)}
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                        selected
                                          ? "bg-rose-500 border-rose-500 text-white"
                                          : "bg-white border-gray-200 text-gray-600 hover:border-rose-300"
                                      }`}>
                                      {addon.name} +{fmt(addon.price)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2 — Resumen */}
                {!success && step === 2 && (
                  <motion.div key="step2"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="px-5 py-4 space-y-4"
                  >
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Cliente</p>
                      <SummaryRow icon={<RiUser3Line size={14} />} label={name} />
                      <SummaryRow icon={<RiPhoneLine size={14} />} label={phone} />
                      {email && <SummaryRow icon={<RiMailLine size={14} />} label={email} />}
                      <SummaryRow icon={<RiMapPinLine size={14} />} label={address} />
                      {addressRef && <SummaryRow icon={<RiMapPinLine size={14} />} label={addressRef} sub />}
                      <SummaryRow icon={<RiTimeLine size={14} />} label={`Entrega: ${estimatedTime}`} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Productos</p>
                      <div className="space-y-2">
                        {cart.map(c => (
                          <div key={c.product.id}
                            className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {c.product.name}{" "}
                                <span className="text-gray-400 font-normal">×{c.quantity}</span>
                              </p>
                              {c.addons.length > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  + {c.addons.map(a => a.name).join(", ")}
                                </p>
                              )}
                            </div>
                            <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                              {fmt(
                                c.price * c.quantity +
                                c.addons.reduce((acc, a) => acc + a.price, 0) * c.quantity
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-rose-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-semibold">{fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Domicilio</span>
                        <span className="font-semibold">{fmt(deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-rose-200">
                        <span>Total</span>
                        <span className="text-rose-600">{fmt(total)}</span>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer */}
            {!success && (
              <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
                <div className="flex gap-3">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(s => s - 1)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Atrás
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      onClick={() => setStep(s => s + 1)}
                      disabled={step === 0 ? !step0Valid : !step1Valid}
                      className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors
                                 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-rose-200"
                    >
                      {step === 0 ? "Agregar productos →" : "Revisar pedido →"}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors
                                 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-rose-200"
                    >
                      {loading
                        ? <><RiLoaderLine className="animate-spin" size={18} /> Guardando…</>
                        : "✓ Confirmar pedido"
                      }
                    </button>
                  )}
                </div>

                {step === 1 && cart.length > 0 && (
                  <div className="mt-3 flex items-center justify-between bg-rose-50 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-rose-700">
                      <RiShoppingBagLine size={16} />
                      <span className="font-semibold">
                        {cart.reduce((a, c) => a + c.quantity, 0)} producto(s)
                      </span>
                    </div>
                    <span className="text-sm font-bold text-rose-700">{fmt(subtotal)}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all";

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
        <span className="text-rose-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 ${sub ? "opacity-60" : ""}`}>
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <span className={`text-sm ${sub ? "text-gray-400" : "text-gray-700"}`}>{label}</span>
    </div>
  );
}