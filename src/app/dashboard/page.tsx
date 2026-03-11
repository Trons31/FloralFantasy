import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { RiShoppingBagLine, RiMoneyDollarCircleLine, RiTimeLine, RiFlowerLine,
         RiArrowRightLine, RiLeafLine, RiGiftLine, RiCalculatorLine } from "react-icons/ri";

export default async function DashboardPage() {
  const today = new Date(); today.setHours(0,0,0,0);

  const [ordersToday, revenueData, pending, products, flowers] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }).catch(() => 0),
    prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { in: ["PAID","PROCESSING","READY","OUT_FOR_DELIVERY","DELIVERED"] } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),
    prisma.order.count({ where: { status: { in: ["PAID","PROCESSING"] } } }).catch(() => 0),
    prisma.product.count().catch(() => 0),
    prisma.flower.count().catch(() => 0),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 6, orderBy: { createdAt: "desc" },
    select: { id: true, trackingToken: true, customerName: true, total: true, status: true, createdAt: true },
  }).catch(() => []);

  const STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    PAID: "bg-blue-100 text-blue-700",
    PROCESSING: "bg-amber-100 text-amber-700",
    READY: "bg-green-100 text-green-700",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  const STATUS_LABEL: Record<string, string> = {
    PENDING:"Pendiente", PAID:"Pagado", PROCESSING:"Procesando",
    READY:"Listo", OUT_FOR_DELIVERY:"En camino", DELIVERED:"Entregado", CANCELLED:"Cancelado",
  };

  const stats = [
    { icon: RiShoppingBagLine, label: "Pedidos hoy",   value: String(ordersToday), sub: "del día", color: "bg-blue-50 text-blue-600" },
    { icon: RiMoneyDollarCircleLine, label: "Ingresos hoy", value: formatPrice(revenueData._sum.total || 0), sub: "ventas confirmadas", color: "bg-green-50 text-green-600" },
    { icon: RiTimeLine, label: "Pendientes",  value: String(pending),    sub: "requieren atención", color: "bg-amber-50 text-amber-600" },
    { icon: RiFlowerLine, label: "Flores",    value: String(flowers),    sub: "tipos registrados",  color: "bg-pink-50 text-pink-600" },
  ];

  const quick = [
    { href: "/dashboard/pedidos",      icon: RiShoppingBagLine, label: "Ver pedidos activos",   desc: "Gestiona los pedidos en curso" },
    { href: "/dashboard/flores",       icon: RiFlowerLine,      label: "Gestionar flores",       desc: "Registra tipos de flores" },
    { href: "/dashboard/productos",    icon: RiLeafLine,        label: "Gestionar productos",    desc: "Ramos y arreglos" },
    { href: "/dashboard/contabilidad", icon: RiCalculatorLine,  label: "Contabilidad",           desc: "Ingresos y egresos" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats grid - matches reference design */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-500 leading-tight">{s.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="text-lg" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quick.map(q => (
            <Link key={q.href} href={q.href}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-primary-200 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all">
                <q.icon className="text-xl" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{q.label}</p>
                <p className="text-xs text-gray-400">{q.desc}</p>
              </div>
              <RiArrowRightLine className="text-gray-300 group-hover:text-primary-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Pedidos recientes</h2>
          <Link href="/dashboard/pedidos" className="text-sm text-primary-600 font-medium hover:text-primary-700">Ver todos →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <RiShoppingBagLine className="text-4xl mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay pedidos aún</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map(o => (
              <div key={o.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{o.customerName}</p>
                  <p className="text-xs text-gray-400 font-mono">{o.trackingToken}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <p className="font-bold text-sm text-gray-900 ml-1">{formatPrice(o.total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
