import { es } from "date-fns/locale";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { prisma } from "@/lib/prisma";

export const VALID_ACCOUNTING_ORDER_STATUSES = ["PAID", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export type AccountingMode = "day" | "month";

export type AccountingPeriodInput = {
  mode: AccountingMode;
  year: number;
  month: number;
  day?: number;
};

export type AccountingDay = {
  date: string;
  label: string;
  dayNumber: number;
  income: number;
  expenses: number;
  orders: number;
  profit: number;
  isSelected: boolean;
};

export type TopProduct = {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type AccountingOrderRow = {
  id: string;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  createdAt: string;
  itemsSummary: string;
};

export type AccountingExpenseRow = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  registeredBy: string | null;
  receiptPhotoUrl: string | null;
};

export type AccountingSummary = {
  mode: AccountingMode;
  year: number;
  month: number;
  day: number | null;
  monthLabel: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    income: number;
    expenses: number;
    profit: number;
    orderCount: number;
    avgTicket: number;
  };
  selectedProduct: TopProduct | null;
  topProducts: TopProduct[];
  days: AccountingDay[];
  orders: AccountingOrderRow[];
  expenses: AccountingExpenseRow[];
};

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function clampDay(year: number, month: number, day: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(Math.max(day, 1), lastDay);
}

export async function getAccountingSummary(input: AccountingPeriodInput): Promise<AccountingSummary> {
  const year = Number.isFinite(input.year) ? input.year : new Date().getFullYear();
  const month = Number.isFinite(input.month) ? input.month : new Date().getMonth() + 1;
  const mode: AccountingMode = input.mode === "day" ? "day" : "month";
  const selectedDay = mode === "day" ? clampDay(year, month, input.day || new Date().getDate()) : null;

  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const periodStart = mode === "day"
    ? startOfDay(new Date(year, month - 1, selectedDay || 1))
    : monthStart;
  const periodEnd = mode === "day"
    ? endOfDay(new Date(year, month - 1, selectedDay || 1))
    : monthEnd;

  const validStatuses = [...VALID_ACCOUNTING_ORDER_STATUSES];

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: validStatuses },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: {
        id: true,
        trackingToken: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            price: true,
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
      },
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
  ]);

  const dayInterval = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const orderMap = new Map<string, { income: number; orders: number }>();
  const expenseMap = new Map<string, number>();
  const productTotals = new Map<string, TopProduct>();

  orders.forEach((order) => {
    const key = toDateKey(order.createdAt);
    const current = orderMap.get(key) || { income: 0, orders: 0 };
    current.income += Number(order.total || 0);
    current.orders += 1;
    orderMap.set(key, current);

    order.items.forEach((item) => {
      const productId = item.productId || item.product?.name || "Producto";
      const currentProduct = productTotals.get(productId) || {
        productId,
        productName: item.product?.name || "Producto",
        quantity: 0,
        revenue: 0,
      };
      currentProduct.quantity += Number(item.quantity || 0);
      currentProduct.revenue += Number(item.price || 0) * Number(item.quantity || 0);
      productTotals.set(productId, currentProduct);
    });
  });

  expenses.forEach((expense) => {
    const key = toDateKey(expense.date);
    expenseMap.set(key, (expenseMap.get(key) || 0) + Number(expense.amount || 0));
  });

  const days: AccountingDay[] = dayInterval.map((date) => {
    const key = toDateKey(date);
    const income = orderMap.get(key)?.income || 0;
    const ordersCount = orderMap.get(key)?.orders || 0;
    const expensesAmount = expenseMap.get(key) || 0;
    const isSelected = mode === "day" && selectedDay === date.getDate();

    return {
      date: key,
      label: format(date, "EEE", { locale: es }),
      dayNumber: date.getDate(),
      income,
      expenses: expensesAmount,
      orders: ordersCount,
      profit: income - expensesAmount,
      isSelected,
    };
  });

  const income = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const expensesTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const profit = income - expensesTotal;
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? income / orderCount : 0;

  const topProducts = Array.from(productTotals.values())
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5);

  const selectedProduct = topProducts[0] || null;

  return {
    mode,
    year,
    month,
    day: selectedDay,
    monthLabel: format(monthDate, "MMMM yyyy", { locale: es }),
    periodLabel: mode === "day"
      ? format(new Date(year, month - 1, selectedDay || 1), "d 'de' MMMM yyyy", { locale: es })
      : format(monthDate, "MMMM yyyy", { locale: es }),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    summary: {
      income,
      expenses: expensesTotal,
      profit,
      orderCount,
      avgTicket,
    },
    selectedProduct,
    topProducts,
    days,
    orders: orders.map((order) => ({
      id: order.id,
      trackingToken: order.trackingToken,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status: order.status,
      total: Number(order.total || 0),
      createdAt: order.createdAt.toISOString(),
      itemsSummary: order.items
        .map((item) => `${item.quantity > 1 ? `x${item.quantity} ` : ""}${item.product?.name || "-"}`)
        .join(" · "),
    })),
    expenses: expenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      amount: Number(expense.amount || 0),
      category: expense.category,
      date: expense.date.toISOString(),
      registeredBy: expense.registeredBy || null,
      receiptPhotoUrl: expense.receiptPhotoUrl || null,
    })),
  };
}
