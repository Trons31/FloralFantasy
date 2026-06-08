import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrderManagementUser } from "@/lib/route-auth";

export async function GET(req: NextRequest) {
  const access = await requireOrderManagementUser(req);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const registeredBy = req.nextUrl.searchParams.get("registeredBy");
  if (!registeredBy) return NextResponse.json({ error: "registeredBy requerido" }, { status: 400 });

  if (access.kind === "operations" && access.user.role !== "CORREDOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: {
      registeredBy,
      date: { gte: start, lte: end },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      category: true,
      date: true,
      receiptPhotoUrl: true,
      receiptPublicId: true,
      registeredBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(expenses);
}
