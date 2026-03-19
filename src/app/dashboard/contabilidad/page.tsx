import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import ContabilidadDashboard from "./ContabilidadDashboard";

export default async function ContabilidadPage() {
  const now   = new Date();
  const mesStart  = startOfMonth(now);
  const mesEnd    = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd   = endOfMonth(subMonths(now, 1));

  const [
    ordersThisMonth, ordersPrevMonth,
    expensesThisMonth, expensesPrevMonth,
    topProducts, dailyRevenue,
  ] = await Promise.all([
    // Ingresos este mes
    prisma.order.aggregate({
      where: { status: { in: ["PAID","PROCESSING","READY","OUT_FOR_DELIVERY","DELIVERED"] }, createdAt: { gte: mesStart, lte: mesEnd } },
      _sum: { total: true }, _count: { id: true },
    }),
    // Ingresos mes pasado
    prisma.order.aggregate({
      where: { status: { in: ["PAID","PROCESSING","READY","OUT_FOR_DELIVERY","DELIVERED"] }, createdAt: { gte: prevStart, lte: prevEnd } },
      _sum: { total: true }, _count: { id: true },
    }),
    // Egresos este mes
    prisma.expense.aggregate({ where: { date: { gte: mesStart, lte: mesEnd } }, _sum: { amount: true } }),
    // Egresos mes pasado
    prisma.expense.aggregate({ where: { date: { gte: prevStart, lte: prevEnd } }, _sum: { amount: true } }),
    // Top productos este mes
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: mesStart, lte: mesEnd }, status: { in: ["PAID","PROCESSING","READY","OUT_FOR_DELIVERY","DELIVERED"] } } },
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }),
    // Ingresos diarios ultimos 14 dias
    prisma.order.findMany({
      where: { status: { in: ["PAID","PROCESSING","READY","OUT_FOR_DELIVERY","DELIVERED"] }, createdAt: { gte: new Date(now.getTime() - 14*24*60*60*1000) } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Enrich top products with names
  const productIds = topProducts.map(p => p.productId);
  const products   = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, price: true } });
  const topProductsEnriched = topProducts.map(p => ({
    ...p,
    product: products.find(pr => pr.id === p.productId),
    revenue: p._sum.price || 0,
    qty:     p._sum.quantity || 0,
  }));

  // Egresos por categoría
  const expensesByCategory = await prisma.expense.groupBy({
    by:    ["category"],
    where: { date: { gte: mesStart, lte: mesEnd } },
    _sum:  { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  // Build daily data (last 14 days)
  const dailyMap: Record<string, number> = {};
  dailyRevenue.forEach(o => {
    const key = o.createdAt.toISOString().split("T")[0];
    dailyMap[key] = (dailyMap[key] || 0) + o.total;
  });
  const days: { date:string; revenue:number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d   = new Date(now.getTime() - i*24*60*60*1000);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, revenue: dailyMap[key] || 0 });
  }

  const income      = ordersThisMonth._sum.total   || 0;
  const expenses    = expensesThisMonth._sum.amount || 0;
  const profit      = income - expenses;
  const prevIncome  = ordersPrevMonth._sum.total    || 0;
  const prevExpenses = expensesPrevMonth._sum.amount || 0;
  const prevProfit  = prevIncome - prevExpenses;
  const orderCount  = ordersThisMonth._count.id;

  // Average ticket
  const avgTicket = orderCount > 0 ? income / orderCount : 0;

  // How many more products to sell to break even if negative
  const deficitRecommendation = profit < 0 ? Math.ceil(Math.abs(profit) / (avgTicket || 50000)) : 0;

  return (
    <ContabilidadDashboard
      current={{ income, expenses, profit, orderCount, avgTicket }}
      previous={{ income: prevIncome, expenses: prevExpenses, profit: prevProfit, orderCount: ordersPrevMonth._count.id }}
      topProducts={topProductsEnriched}
      expensesByCategory={expensesByCategory.map(e => ({ category: e.category, amount: e._sum.amount || 0 }))}
      dailyRevenue={days}
      deficitRecommendation={deficitRecommendation}
    />
  );
}