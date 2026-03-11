"use client";
import { useState } from "react";
import Header from "@/components/client/Header";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RiArrowRightLine, RiTimeLine, RiShoppingBagLine, RiTruckLine, RiShieldCheckLine } from "react-icons/ri";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DELIVERY_FEE = 8000;
const schema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido"),
  address: z.string().min(5, "Dirección muy corta"),
  addressRef: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { items, getTotalPrice, getEstimatedTime, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const subtotal = getTotalPrice();
  const total    = subtotal + DELIVERY_FEE;
  const est      = getEstimatedTime();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!items.length) { toast.error("Tu carrito está vacío"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items, total, deliveryFee: DELIVERY_FEE, estimatedTime: est.label }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);
      const wompiUrl = `https://checkout.wompi.co/p/?public-key=${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}&currency=COP&amount-in-cents=${total * 100}&reference=${order.id}&redirect-url=${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirmacion`;
      clearCart();
      window.location.href = wompiUrl;
    } catch (e: any) { toast.error("Error: " + e.message); setLoading(false); }
  };

  if (!items.length) return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header/>
      <div className="pt-28 text-center py-20">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-semibold mb-4">Tu carrito está vacío</h2>
        <a href="/flores" className="bg-primary-600 text-white px-8 py-3 rounded-full inline-block hover:bg-primary-700 transition-colors">Ver catálogo</a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header/>
      <div className="pt-24 max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-semibold mb-8" style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>Finalizar compra</h1>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-lg mb-5">Datos de entrega</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {[
                { name:"name",       label:"Nombre completo",          type:"text",  ph:"Tu nombre" },
                { name:"phone",      label:"Teléfono",                 type:"tel",   ph:"300 000 0000" },
                { name:"email",      label:"Email",                    type:"email", ph:"tu@email.com" },
                { name:"address",    label:"Dirección de entrega",     type:"text",  ph:"Calle 123 #45-67" },
                { name:"addressRef", label:"Referencias (opcional)",   type:"text",  ph:"Apto 201, casa azul..." },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input {...register(f.name as keyof FormData)} type={f.type} placeholder={f.ph}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-400 text-sm"/>
                  {errors[f.name as keyof FormData] && <p className="text-red-500 text-xs mt-1">{errors[f.name as keyof FormData]?.message}</p>}
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 rounded-full font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all mt-2">
                {loading ? "Procesando..." : <><span>Ir a pagar con Wompi</span><RiArrowRightLine size={18}/></>}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <RiShoppingBagLine className="text-primary-500"/> Resumen
              </h2>
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image || "https://images.unsplash.com/photo-1487530811015-780a34f1e98d?w=80"} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              {est.value > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-sm text-amber-700">
                  <RiTimeLine size={15}/> Entrega estimada: <strong>{est.label}</strong>
                </div>
              )}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><RiTruckLine size={14}/> Domicilio</span>
                  <span>{formatPrice(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span><span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <RiShieldCheckLine size={14}/> Pago 100% seguro con Wompi
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
