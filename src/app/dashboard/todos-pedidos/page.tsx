import { prisma } from "@/lib/prisma";
import PedidosListClient from "./PedidosListClient";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default async function TodosPedidosPage({
  searchParams,
}: {
  searchParams: { periodo?:string; from?:string; to?:string; page?:string; status?:string; q?:string };
}) {
  const periodo = searchParams.periodo || "mes";
  const page    = Math.max(1, parseInt(searchParams.page || "1"));
  const perPage = 20;
  const now     = new Date();

  // ── Date range ──────────────────────────────────────────────────
  let dateFrom: Date | undefined;
  let dateTo:   Date | undefined = endOfDay(now);

  if (searchParams.from && searchParams.to) {
    dateFrom = startOfDay(new Date(searchParams.from));
    dateTo   = endOfDay(new Date(searchParams.to));
  } else if (periodo !== "todos") {
    switch (periodo) {
      case "hoy":        dateFrom = startOfDay(now); break;
      case "semana":     dateFrom = new Date(now.getTime() - 7*24*60*60*1000); break;
      case "mes":        dateFrom = startOfMonth(now); break;
      case "mes_pasado":
        dateFrom = startOfMonth(subMonths(now, 1));
        dateTo   = endOfMonth(subMonths(now, 1));
        break;
    }
  }

  // ── where con todos los filtros activos (para lista + total) ────
  const where: any = {};
  if (dateFrom) where.createdAt = { gte: dateFrom, lte: dateTo };
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.q) where.OR = [
    { customerName:  { contains: searchParams.q, mode: "insensitive" } },
    { trackingToken: { contains: searchParams.q, mode: "insensitive" } },
    { customerPhone: { contains: searchParams.q, mode: "insensitive" } },
  ];

  // ── whereBase: solo fecha + búsqueda, SIN filtro de status ──────
  // Sirve para los contadores de cada estado (siempre se ven todos)
  const whereBase: any = {};
  if (dateFrom) whereBase.createdAt = { gte: dateFrom, lte: dateTo };
  if (searchParams.q) whereBase.OR = where.OR;

  const [total, orders, summary, statusBreakdown] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy:  { createdAt: "desc" },
      skip:     (page - 1) * perPage,
      take:     perPage,
    }),
    prisma.order.aggregate({
      where,
      _sum:   { total: true },
      _count: { id: true },
    }),
    // Contadores de estado usando whereBase (sin filtro de status)
    prisma.order.groupBy({
      by:      ["status"],
      where:   whereBase,
      _count:  { id: true },
    }),
  ]);

  const paymentMethodIds = Array.from(
    new Set(orders.map(order => order.paymentMethodId).filter(Boolean))
  ) as string[];
  const paymentMethods = paymentMethodIds.length
    ? await prisma.paymentMethod.findMany({
        where: { id: { in: paymentMethodIds } },
        select: { id: true, title: true },
      }).catch(() => [])
    : [];
  const paymentMethodMap = new Map(paymentMethods.map(method => [method.id, method.title]));

  return (
    <PedidosListClient
      orders={orders.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        paymentMethodTitle: o.paymentMethodId ? paymentMethodMap.get(o.paymentMethodId) || null : null,
      }))}
      summary={{ total: summary._sum.total || 0, count: total }}
      statusBreakdown={statusBreakdown.map(s => ({ status: s.status, count: s._count.id }))}
      pagination={{ page, perPage, total }}
      filters={{
        periodo,
        from:    searchParams.from,
        to:      searchParams.to,
        status:  searchParams.status,
        q:       searchParams.q,
      }}
    />
  );
}
