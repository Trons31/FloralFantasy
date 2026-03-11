import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTrackingToken } from "@/lib/tokens";
import { sendOrderConfirmation } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/webpush";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, address, addressRef, items, total, deliveryFee, estimatedTime } = body;
    const trackingToken = generateTrackingToken();
    const order = await prisma.order.create({
      data: {
        trackingToken, customerName: name, customerPhone: phone,
        customerEmail: email, address, addressRef, total, deliveryFee,
        estimatedTime, status: "PENDING",
        statusHistory: { create: { status: "PENDING", note: "Pedido creado" } },
        items: {
          create: items.map((item: any) => ({
            productId: item.productId, quantity: item.quantity, price: item.price,
            addons: { create: (item.addons || []).map((a: any) => ({ addonId: a.id, price: a.price })) },
          })),
        },
      },
    });
    Promise.all([
      sendOrderConfirmation({ email, customerName: name, trackingToken, total, estimatedTime }),
      sendPushToAdmins({ title: "Nuevo pedido 🌸", body: `${name} — ${new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(total)}` }),
    ]).catch(console.error);
    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(orders);
}
