import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const registeredBy = req.nextUrl.searchParams.get("registeredBy");
  if (!registeredBy) return NextResponse.json({ error: "registeredBy requerido" }, { status: 400 });

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: {
      registeredBy,
      date: { gte: start, lte: end },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(expenses);
}