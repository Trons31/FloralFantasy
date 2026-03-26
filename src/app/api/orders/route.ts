// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTrackingToken } from "@/lib/tokens";
import { sendOrderConfirmation } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/webpush";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

function generateWompiSignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string
): string {
  const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash("sha256").update(concatenated).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, phone, email, address, addressRef,
      items, total, deliveryFee, estimatedTime,
      source, // "CLIENT" | "ADMIN" — el frontend lo envía
    } = body;

    // Verificar que todos los productos existen
    const productIds = items.map((i: any) => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const foundIds = existingProducts.map((p: any) => p.id);
    const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Uno o más productos ya no están disponibles. Recarga la página y vuelve a agregarlos." },
        { status: 400 }
      );
    }

    const trackingToken = generateTrackingToken();

    // Todos los pedidos arrancan en PENDING — el administrador los mueve manualmente a PROCESSING
    const initialStatus = "PENDING";

    const order = await prisma.order.create({
      data: {
        trackingToken,
        customerName: name,
        customerPhone: phone,
        customerEmail: email ?? "",
        address,
        addressRef,
        total,
        deliveryFee,
        estimatedTime,
        status: initialStatus,
        source: source === "ADMIN" ? "ADMIN" : "CLIENT",
        statusHistory: {
          create: {
            status: initialStatus,
            note: source === "ADMIN"
              ? "Pedido ingresado manualmente por el administrador — pendiente de procesamiento"
              : "Pedido creado por cliente",
          },
        },
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            addons: {
              create: (item.addons || []).map((a: any) => ({
                addonId: a.id,
                price: a.price,
              })),
            },
          })),
        },
      },
      // Incluir relaciones para devolver el pedido completo al frontend
      include: {
        items: {
          include: {
            product: { include: { images: true } },
            addons: { include: { addon: true } },
          },
        },
      },
    });

    // Generar signature de integridad para Wompi (solo para pedidos de cliente)
    const amountInCents = Math.round(total * 100);
    const currency = "COP";
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    let signature: string | null = null;
    if (integritySecret && source !== "ADMIN") {
      signature = generateWompiSignature(order.id, amountInCents, currency, integritySecret);
    }

    // Notificaciones — no bloquean la respuesta
    Promise.all([
      // Solo manda email de confirmación si hay email y es pedido de cliente
      email && source !== "ADMIN"
        ? sendOrderConfirmation({ email, customerName: name, trackingToken, total, estimatedTime })
        : Promise.resolve(),
      sendPushToAdmins({
        title: source === "ADMIN" ? "Pedido manual registrado" : "Nuevo pedido",
        body: `${name} — ${new Intl.NumberFormat("es-CO", {
          style: "currency", currency: "COP", minimumFractionDigits: 0,
        }).format(total)}`,
      }),
    ]).catch(console.error);

    return NextResponse.json({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      wompiSignature: signature,
      amountInCents,
    });
  } catch (e: any) {
    console.error("Order create error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          addons: { include: { addon: true } },
        },
      },
    },
  });
  return NextResponse.json(orders);
}