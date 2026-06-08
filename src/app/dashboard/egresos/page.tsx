import { prisma } from "@/lib/prisma";
import EgresosClient from "./EgresosClient";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

type ReceiptPhoto = { url: string; publicId?: string | null };

function parseReceiptPhotos(value: unknown): ReceiptPhoto[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter((photo): photo is { url?: unknown; publicId?: unknown } => !!photo && typeof photo === "object")
    .map((photo) => ({
      url: typeof photo.url === "string" ? photo.url : "",
      publicId: typeof photo.publicId === "string" ? photo.publicId : null,
    }))
    .filter((photo) => Boolean(photo.url));
}

export default async function EgresosPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; day?: string; page?: string };
}) {
  const now = new Date();
  const year = Number.parseInt(searchParams.year || String(now.getFullYear()), 10);
  const month = Number.parseInt(searchParams.month || String(now.getMonth() + 1), 10);
  const monthIndex = Math.min(Math.max(month, 1), 12) - 1;
  const monthAnchor = new Date(year, monthIndex, 1);
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(
    Math.max(Number.parseInt(searchParams.day || String(now.getDate()), 10), 1),
    maxDay
  );
  const page = Math.max(1, Number.parseInt(searchParams.page || "1", 10));
  const perPage = 10;

  const selectedDate = new Date(year, monthIndex, day);
  const selectedFrom = startOfDay(selectedDate);
  const selectedTo = endOfDay(selectedDate);
  const monthFrom = startOfMonth(monthAnchor);
  const monthTo = endOfMonth(monthAnchor);

  const dayTotal = await prisma.expense.count({ where: { date: { gte: selectedFrom, lte: selectedTo } } });
  const totalPages = Math.max(1, Math.ceil(dayTotal / perPage));
  const currentPage = Math.min(page, totalPages);

  const [dayExpenses, daySummary, monthExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: selectedFrom, lte: selectedTo } },
      orderBy: { date: "desc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
    }),
    prisma.expense.aggregate({
      where: { date: { gte: selectedFrom, lte: selectedTo } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: monthFrom, lte: monthTo } },
      select: { date: true, amount: true },
    }),
  ]);

  const dayMap = new Map<number, { count: number; amount: number }>();
  monthExpenses.forEach((expense) => {
    const expenseDate = new Date(expense.date);
    const key = expenseDate.getDate();
    const current = dayMap.get(key) || { count: 0, amount: 0 };
    current.count += 1;
    current.amount += expense.amount;
    dayMap.set(key, current);
  });

  const days = eachDayOfInterval({ start: monthFrom, end: monthTo }).map((dayDate) => {
    const stats = dayMap.get(dayDate.getDate()) || { count: 0, amount: 0 };
    const label = format(dayDate, "EEE", { locale: es }).replace(/\./g, "").toUpperCase();

    return {
      date: dayDate.toISOString(),
      dayNumber: dayDate.getDate(),
      label,
      count: stats.count,
      amount: stats.amount,
    };
  });

  return (
    <EgresosClient
      expenses={dayExpenses.map((expense) => {
        const receiptPhotos = parseReceiptPhotos((expense as { receiptPhotos?: unknown }).receiptPhotos);
        return {
          ...expense,
          date: expense.date.toISOString(),
          createdAt: expense.createdAt.toISOString(),
          receiptPhotos,
        };
      })}
      summary={{
        total: daySummary._sum.amount || 0,
        count: dayTotal,
      }}
      pagination={{ page: currentPage, perPage, total: dayTotal }}
      selection={{
        year,
        month: monthIndex + 1,
        day,
        monthLabel: format(monthFrom, "MMMM yyyy", { locale: es }),
        dayLabel: format(selectedDate, "d 'de' MMMM yyyy", { locale: es }),
        selectedDateValue: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      }}
      days={days}
    />
  );
}
