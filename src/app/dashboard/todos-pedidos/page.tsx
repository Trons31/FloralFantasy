import { prisma } from "@/lib/prisma";
import PedidosListClient from "./PedidosListClient";
import {
  addDays,
  endOfDay,
  endOfMonth,
  getDaysInMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";

export const dynamic = "force-dynamic";

type SearchParams = {
  date?: string;
  anchor?: string;
  page?: string;
  status?: string;
  q?: string;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function statusFilter(status?: string) {
  switch (status) {
    case "PENDING":
      return { in: ["PENDING", "PENDING_PAYMENT_CONFIRMATION"] };
    case "PRODUCTION":
      return { in: ["PAID", "PROCESSING", "READY"] };
    case "PAID":
    case "PAYMENT_INVALID":
    case "OUT_FOR_DELIVERY":
    case "DELIVERED":
    case "CANCELLED":
      return status;
    default:
      return undefined;
  }
}

export default async function TodosPedidosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const perPage = 10;
  const anchorDate = parseLocalDate(searchParams.anchor || searchParams.date);
  const requestedDate = parseLocalDate(searchParams.date);
  const selectedDate =
    requestedDate.getFullYear() === anchorDate.getFullYear() &&
    requestedDate.getMonth() === anchorDate.getMonth()
      ? requestedDate
      : startOfMonth(anchorDate);
  const selectedDateKey = dateKey(selectedDate);
  const anchorDateKey = dateKey(anchorDate);
  const selectedStart = startOfDay(selectedDate);
  const selectedEnd = endOfDay(selectedDate);
  const previousStart = startOfDay(subDays(selectedDate, 1));
  const previousEnd = endOfDay(subDays(selectedDate, 1));
  const sliderStart = startOfMonth(anchorDate);
  const sliderEnd = endOfMonth(anchorDate);

  const searchWhere = searchParams.q
    ? {
        OR: [
          { customerName: { contains: searchParams.q, mode: "insensitive" as const } },
          { trackingToken: { contains: searchParams.q, mode: "insensitive" as const } },
          { customerPhone: { contains: searchParams.q, mode: "insensitive" as const } },
          { address: { contains: searchParams.q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where: any = {
    createdAt: { gte: selectedStart, lte: selectedEnd },
    ...searchWhere,
  };
  const selectedStatus = statusFilter(searchParams.status);
  if (selectedStatus) where.status = selectedStatus;

  const whereBase: any = {
    createdAt: { gte: selectedStart, lte: selectedEnd },
    ...searchWhere,
  };

  const loadOrders = () =>
    Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: {
                    select: { url: true, isMain: true },
                    orderBy: [{ isMain: "desc" }, { order: "asc" }],
                  },
                },
              },
              addons: {
                include: {
                  addon: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.order.aggregate({
        where,
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: whereBase,
        _count: { id: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sliderStart, lte: sliderEnd } },
        select: { createdAt: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: selectedStart, lte: selectedEnd } },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: previousStart, lte: previousEnd } },
        _count: { id: true },
      }),
    ]);

  let databaseError = false;
  let data: Awaited<ReturnType<typeof loadOrders>>;

  try {
    data = await loadOrders();
  } catch {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      data = await loadOrders();
    } catch (error) {
      console.error("No se pudieron cargar los pedidos:", error);
      databaseError = true;
      data = [
        0,
        [],
        { _sum: { total: null }, _count: { id: 0 } },
        [],
        [],
        [],
        [],
      ] as Awaited<ReturnType<typeof loadOrders>>;
    }
  }

  const [
    total,
    orders,
    summary,
    statusBreakdown,
    sliderOrders,
    selectedDayStats,
    previousDayStats,
  ] = data;

  const buildStats = (groups: Array<{ status: string; _count: { id: number } }>) => {
    const counts = new Map<string, number>(groups.map(group => [group.status, group._count.id]));
    const count = (...statuses: string[]) =>
      statuses.reduce((sum, status) => sum + (counts.get(status) || 0), 0);
    return {
      total: groups.reduce((sum, group) => sum + group._count.id, 0),
      pending: count("PENDING", "PENDING_PAYMENT_CONFIRMATION"),
      production: count("PAID", "PROCESSING", "READY"),
      route: count("OUT_FOR_DELIVERY"),
      delivered: count("DELIVERED"),
      cancelled: count("CANCELLED"),
    };
  };
  const dashboardStats = buildStats(selectedDayStats);
  const previousStats = buildStats(previousDayStats);

  const dailyCountMap = new Map<string, number>();
  sliderOrders.forEach(order => {
    const key = dateKey(order.createdAt);
    dailyCountMap.set(key, (dailyCountMap.get(key) || 0) + 1);
  });
  const days = Array.from({ length: getDaysInMonth(anchorDate) }, (_, index) => {
    const date = addDays(sliderStart, index);
    const key = dateKey(date);
    return { date: key, count: dailyCountMap.get(key) || 0 };
  });

  const paymentMethodIds = Array.from(
    new Set(orders.map(order => order.paymentMethodId).filter(Boolean))
  ) as string[];
  const paymentMethods = paymentMethodIds.length
    ? await prisma.paymentMethod
        .findMany({
          where: { id: { in: paymentMethodIds } },
          select: { id: true, title: true },
        })
        .catch(() => [])
    : [];
  const paymentMethodMap = new Map(paymentMethods.map(method => [method.id, method.title]));

  return (
    <PedidosListClient
      orders={orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        paymentMethodTitle: order.paymentMethodId
          ? paymentMethodMap.get(order.paymentMethodId) || null
          : null,
      }))}
      summary={{ total: summary._sum.total || 0, count: total }}
      statusBreakdown={statusBreakdown.map(status => ({
        status: status.status,
        count: status._count.id,
      }))}
      dashboardStats={dashboardStats}
      previousStats={previousStats}
      days={days}
      pagination={{ page, perPage, total }}
      filters={{
        date: selectedDateKey,
        anchor: anchorDateKey,
        status: searchParams.status,
        q: searchParams.q,
      }}
      databaseError={databaseError}
    />
  );
}
