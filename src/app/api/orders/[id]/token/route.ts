import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { trackingToken: true, customerName: true, status: true },
  });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json(order);
}