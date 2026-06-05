import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, startOfMonth, subMonths, endOfDay } from "date-fns";
import ReportesClient from "./ReportesClient";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { periodo?: string; from?: string; to?: string; page?: string };
}) {
  const periodo = searchParams.periodo || "semana";
  const page    = Math.max(1, parseInt(searchParams.page || "1"));
  const perPage = 15;

  const now = new Date();
  let dateFrom: Date;
  let dateTo: Date = endOfDay(now);
  let periodoLabel = "";

  if (searchParams.from && searchParams.to) {
    dateFrom     = startOfDay(new Date(searchParams.from));
    dateTo       = endOfDay(new Date(searchParams.to));
    periodoLabel = "Personalizado";
  } else {
    switch (periodo) {
      case "hoy":    dateFrom = startOfDay(now);          periodoLabel = "Hoy";          break;
      case "semana": dateFrom = startOfWeek(now, { weekStartsOn: 1 }); periodoLabel = "Esta semana"; break;
      case "mes":    dateFrom = startOfMonth(now);        periodoLabel = "Este mes";     break;
      case "mes_pasado":
        dateFrom     = startOfMonth(subMonths(now, 1));
        dateTo       = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
        periodoLabel = "Mes pasado";
        break;
      default:       dateFrom = startOfWeek(now, { weekStartsOn: 1 }); periodoLabel = "Esta semana";
    }
  }

  const where: any = {
    status:    { notIn: ["CANCELLED"] },
    createdAt: { gte: dateFrom, lte: dateTo },
  };

  const [totalCount, orders, expenses, allOrdersAgg] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy:  { createdAt: "desc" },
      skip:     (page - 1) * perPage,
      take:     perPage,
    }),
    prisma.expense.findMany({ where: { date: { gte: dateFrom, lte: dateTo } } }),
    prisma.order.aggregate({
      where,
      _sum:   { total: true },
      _count: { id: true },
    }),
  ]);

  const totalIncome   = allOrdersAgg._sum.total   || 0;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Status breakdown
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    where,
    _count: { id: true },
  });

  const serialized = orders.map(o => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return (
    <ReportesClient
      orders={serialized}
      expenses={expenses.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() }))}
      summary={{ totalIncome, totalExpenses, totalOrders: totalCount }}
      statusCounts={statusCounts.map(s => ({ status: s.status, count: s._count.id }))}
      pagination={{ page, perPage, total: totalCount }}
      filters={{ periodo, from: searchParams.from, to: searchParams.to }}
      periodoLabel={periodoLabel}
      dateRange={{ from: dateFrom.toISOString(), to: dateTo.toISOString() }}
    />
  );
}
