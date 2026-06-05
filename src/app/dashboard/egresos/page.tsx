import { prisma } from "@/lib/prisma";
import EgresosClient from "./EgresosClient";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export default async function EgresosPage({
  searchParams,
}: {
  searchParams: { periodo?:string; from?:string; to?:string; page?:string; categoria?:string };
}) {
  const periodo = searchParams.periodo || "mes";
  const page    = Math.max(1, parseInt(searchParams.page || "1"));
  const perPage = 20;
  const now     = new Date();

  let dateFrom: Date;
  let dateTo: Date = endOfDay(now);

  if (searchParams.from && searchParams.to) {
    dateFrom = startOfDay(new Date(searchParams.from));
    dateTo   = endOfDay(new Date(searchParams.to));
  } else {
    switch (periodo) {
      case "hoy":        dateFrom = startOfDay(now); break;
      case "semana":     dateFrom = new Date(now.getTime() - 7*24*60*60*1000); break;
      case "mes":        dateFrom = startOfMonth(now); break;
      case "mes_pasado":
        dateFrom = startOfMonth(subMonths(now, 1));
        dateTo   = endOfMonth(subMonths(now, 1));
        break;
      default:           dateFrom = startOfMonth(now);
    }
  }

  // where con todos los filtros activos (lista + total)
  const where: any = { date: { gte: dateFrom, lte: dateTo } };
  if (searchParams.categoria) where.category = searchParams.categoria;

  // whereBase sin filtro de categoría (para los contadores de categoría)
  const whereBase: any = { date: { gte: dateFrom, lte: dateTo } };

  const [total, expenses, summary, categories] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip:    (page - 1) * perPage,
      take:    perPage,
    }),
    // summary usa where completo (con categoría si aplica)
    prisma.expense.aggregate({
      where,
      _sum:   { amount: true },
      _count: { id: true },
    }),
    // categorías usan whereBase (sin filtro de categoría para ver todas)
    prisma.expense.groupBy({
      by:      ["category"],
      where:   whereBase,
      _sum:    { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  return (
    <EgresosClient
      expenses={expenses.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() }))}
      summary={{ total: summary._sum.amount || 0, count: total }}
      categories={categories.map(c => ({ category: c.category, amount: c._sum.amount || 0 }))}
      pagination={{ page, perPage, total }}
      filters={{ periodo, from: searchParams.from, to: searchParams.to, categoria: searchParams.categoria }}
    />
  );
}
