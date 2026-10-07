import Link from "next/link";
import { FiAlertCircle, FiDollarSign, FiShoppingBag, FiShoppingCart } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import { BRAND_NAME } from "@/components/ui/BrandLogo";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  PENDING_PAYMENT_CONFIRMATION: "bg-amber-50 text-amber-700",
  PAYMENT_INVALID: "bg-red-50 text-red-700",
  PAID: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-amber-50 text-amber-700",
  READY: "bg-green-50 text-green-700",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  PENDING: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT_CONFIRMATION: "Pendiente de confirmación",
  PAYMENT_INVALID: "Pago inválido",
  PAID: "Por preparar",
  PROCESSING: "En producción",
  READY: "Listo",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  PENDING: "Pendiente",
};

/** Etapas del flujo que requieren accion del equipo, en orden. */
const PIPELINE = [
  { status: "PENDING_PAYMENT_CONFIRMATION", hint: "Esperan validación del comprobante", href: "/dashboard/todos-pedidos?status=PENDING", dot: "bg-amber-500" },
  { status: "PAYMENT_INVALID", hint: "Requieren corrección del pago", href: "/dashboard/todos-pedidos?status=PAYMENT_INVALID", dot: "bg-red-500" },
  { status: "PAID", hint: "Pago validado, listos para producir", href: "/dashboard/todos-pedidos?status=PAID", dot: "bg-blue-500" },
  { status: "PROCESSING", hint: "Preparación iniciada", href: "/dashboard/todos-pedidos?status=PROCESSING", dot: "bg-amber-400" },
  { status: "READY", hint: "Pendientes de salida", href: "/dashboard/pedidos", dot: "bg-green-500" },
  { status: "OUT_FOR_DELIVERY", hint: "Con el repartidor", href: "/dashboard/todos-pedidos?status=OUT_FOR_DELIVERY", dot: "bg-purple-500" },
] as const;

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ordersToday, revenueData, statusBreakdown, recentOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }).catch(() => 0),
    prisma.order
      .aggregate({
        where: { createdAt: { gte: today }, status: { in: ["PAID", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] } },
        _sum: { total: true },
        _count: true,
      })
      .catch(() => ({ _sum: { total: 0 }, _count: 0 })),
    prisma.order
      .groupBy({
        by: ["status"],
        where: { status: { in: PIPELINE.map((stage) => stage.status) } },
        _count: { id: true },
      })
      .catch(() => []),
    prisma.order
      .findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { id: true, trackingToken: true, customerName: true, total: true, status: true, createdAt: true },
      })
      .catch(() => []),
  ]);

  const statusMap = Object.fromEntries(statusBreakdown.map((s) => [s.status, s._count.id])) as Record<string, number>;
  const count = (status: string) => statusMap[status] || 0;
  const toValidate = count("PENDING_PAYMENT_CONFIRMATION") + count("PAYMENT_INVALID");
  const inProduction = count("PAID") + count("PROCESSING");

  const todayLabel = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard - {BRAND_NAME}</h1>
        <p className="mt-1 text-sm capitalize text-gray-500">{todayLabel}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Pedidos hoy"
          value={String(ordersToday)}
          subtitle="sin contar cancelados"
          icon={<FiShoppingBag />}
          color="brand"
        />
        <StatCard
          title="Ingresos hoy"
          value={formatPrice(revenueData._sum.total || 0)}
          subtitle={`${revenueData._count} pedidos pagados`}
          icon={<FiDollarSign />}
          color="green"
        />
        <StatCard
          title="Por validar"
          value={String(toValidate)}
          subtitle="comprobantes pendientes"
          icon={<FiAlertCircle />}
          color={toValidate > 0 ? "amber" : "green"}
        />
        <StatCard
          title="En producción"
          value={String(inProduction)}
          subtitle={`${count("READY")} listos para salir`}
          icon={<FiShoppingCart />}
          color="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h2 className="font-bold text-gray-900">Estado de pedidos</h2>
            <Link href="/dashboard/pedidos" className="text-sm font-medium text-brand-600 hover:underline">
              Ver tablero
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {PIPELINE.map((stage) => (
              <Link
                key={stage.status}
                href={stage.href}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stage.dot}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{STATUS_LABEL[stage.status]}</p>
                    <p className="truncate text-xs text-gray-400">{stage.hint}</p>
                  </div>
                </div>
                <span className="text-lg font-bold tabular-nums text-gray-900">{count(stage.status)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h2 className="font-bold text-gray-900">Pedidos recientes</h2>
            <Link href="/dashboard/todos-pedidos" className="text-sm font-medium text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/pedidos/${order.id}`}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
                    {order.customerName.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{order.customerName}</p>
                    <p className="truncate font-mono text-xs text-gray-400">{order.trackingToken}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-bold text-brand-600">{formatPrice(order.total)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[order.status] || STATUS_BADGE.PENDING}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">No hay pedidos aún.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
