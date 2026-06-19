import { prisma } from "@/lib/prisma";
import { eachDayOfInterval, endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import ReportesClient from "./ReportesClient";

export const dynamic = "force-dynamic";

const PREPARED_STATUSES = ["PROCESSING", "READY"] as const;
const REVENUE_STATUSES = ["PAID", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; day?: string; mode?: string };
}) {
  const now = new Date();
  const mode = searchParams.mode === "month" ? "month" : "day";
  const year = Number.parseInt(searchParams.year || String(now.getFullYear()), 10);
  const requestedMonth = Number.parseInt(searchParams.month || String(now.getMonth() + 1), 10);
  const monthIndex = Math.min(Math.max(requestedMonth, 1), 12) - 1;
  const monthStart = startOfMonth(new Date(year, monthIndex, 1));
  const monthEnd = endOfMonth(monthStart);
  const maxDay = monthEnd.getDate();
  const selectedDay = Math.min(Math.max(Number.parseInt(searchParams.day || String(now.getDate()), 10), 1), maxDay);
  const selectedDate = new Date(year, monthIndex, selectedDay);
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  const periodStart = mode === "month" ? monthStart : dayStart;
  const periodEnd = mode === "month" ? monthEnd : dayEnd;

  const [monthOrders, monthHistories, monthExpenses, team, lastAccessSetting] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart, lte: monthEnd }, status: { not: "CANCELLED" } },
      select: {
        id: true,
        trackingToken: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        deliveryPhotoUrl: true,
        items: {
          select: {
            quantity: true,
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderStatusHistory.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { in: [...PREPARED_STATUSES, "DELIVERED"] },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        order: { select: { id: true, trackingToken: true, deliveryPhotoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      select: {
        id: true,
        description: true,
        amount: true,
        category: true,
        date: true,
        registeredBy: true,
        receiptPhotoUrl: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["PREPARADOR", "REPARTIDOR", "CORREDOR"] } },
      select: { id: true, name: true, role: true },
      orderBy: { createdAt: "asc" },
    }).catch(() => []),
    prisma.appSetting.findUnique({ where: { key: "operationsLastAccess" } }).catch(() => null),
  ]);

  const inPeriod = (value: Date) => value >= periodStart && value <= periodEnd;
  const periodOrders = monthOrders.filter(order => inPeriod(order.createdAt));
  const periodHistories = monthHistories.filter(history => inPeriod(history.createdAt));
  const periodExpenses = monthExpenses.filter(expense => inPeriod(expense.date));
  const prepared = periodHistories.filter(history => PREPARED_STATUSES.includes(history.status as typeof PREPARED_STATUSES[number]));
  const delivered = periodHistories.filter(history => history.status === "DELIVERED");
  const uniquePrepared = Array.from(new Map(prepared.map(item => [item.order.id, item])).values());
  const uniqueDelivered = Array.from(new Map(delivered.map(item => [item.order.id, item])).values());

  const activityByDay = new Map<number, number>();
  monthOrders.forEach(order => activityByDay.set(order.createdAt.getDate(), (activityByDay.get(order.createdAt.getDate()) || 0) + 1));
  monthHistories.forEach(history => activityByDay.set(history.createdAt.getDate(), (activityByDay.get(history.createdAt.getDate()) || 0) + 1));
  monthExpenses.forEach(expense => activityByDay.set(expense.date.getDate(), (activityByDay.get(expense.date.getDate()) || 0) + 1));

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(date => ({
    date: date.toISOString(),
    dayNumber: date.getDate(),
    label: format(date, "EEE", { locale: es }).replace(/\./g, ""),
    activity: activityByDay.get(date.getDate()) || 0,
  }));

  const roleMembers = {
    PREPARADOR: team.filter(member => member.role === "PREPARADOR"),
    REPARTIDOR: team.filter(member => member.role === "REPARTIDOR"),
  };
  const roleName = (role: keyof typeof roleMembers, fallback: string) =>
    roleMembers[role].length === 1 ? roleMembers[role][0].name : fallback;

  const activity = [
    {
      id: "preparation",
      member: roleName("PREPARADOR", "Equipo de preparación"),
      role: "PREPARADOR",
      type: "Preparó pedidos",
      count: uniquePrepared.length,
      items: uniquePrepared.map(item => item.order.trackingToken),
      lastActivity: uniquePrepared[0]?.createdAt.toISOString() || null,
    },
    {
      id: "delivery",
      member: roleName("REPARTIDOR", "Equipo de reparto"),
      role: "REPARTIDOR",
      type: "Entregó pedidos",
      count: uniqueDelivered.length,
      items: uniqueDelivered.map(item => item.order.trackingToken),
      evidenceCount: uniqueDelivered.filter(item => !!item.order.deliveryPhotoUrl).length,
      lastActivity: uniqueDelivered[0]?.createdAt.toISOString() || null,
    },
  ].filter(item => item.count > 0);

  const income = periodOrders
    .filter(order => REVENUE_STATUSES.includes(order.status as typeof REVENUE_STATUSES[number]))
    .reduce((sum, order) => sum + order.total, 0);
  const expenseTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const lastAccess = (() => {
    if (!lastAccessSetting?.value) return null;
    try {
      const value = JSON.parse(lastAccessSetting.value);
      return typeof value?.at === "string" ? value : null;
    } catch {
      return null;
    }
  })();

  return (
    <ReportesClient
      selection={{
        mode,
        year,
        month: monthIndex + 1,
        day: selectedDay,
        monthLabel: format(monthStart, "MMMM yyyy", { locale: es }),
        periodLabel: mode === "month"
          ? format(monthStart, "MMMM yyyy", { locale: es })
          : format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es }),
        periodFrom: periodStart.toISOString(),
        periodTo: periodEnd.toISOString(),
      }}
      days={days}
      summary={{
        income,
        expenses: expenseTotal,
        profit: income - expenseTotal,
        totalOrders: periodOrders.length,
        prepared: uniquePrepared.length,
        delivered: uniqueDelivered.length,
      }}
      activity={activity}
      orders={periodOrders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }))}
      expenses={periodExpenses.map(expense => ({
        ...expense,
        date: expense.date.toISOString(),
      }))}
      teamLastAccess={lastAccess}
    />
  );
}
