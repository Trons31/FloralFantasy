import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: {
      city: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      items: {
        include: {
          product: { include: { images: true, flowers: { include: { flower: true } } } },
          addons: { include: { addon: true } },
        },
      },
      paymentMethod: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json(order);
}
