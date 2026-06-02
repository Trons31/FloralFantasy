import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTrackingToken } from "@/lib/tokens";
import { sendPushToAdmins } from "@/lib/webpush";
import { STATUS_LABELS } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      address,
      addressRef,
      items,
      total,
      deliveryFee,
      estimatedTime,
      source,
      adminNote,
      manualAdjustment,
    } = body;

    const isAdminDraft = source === "ADMIN";

    if ((!isAdminDraft && (!name || !phone || !address)) || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const foundIds = existingProducts.map((p) => p.id);
    const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Uno o más productos ya no están disponibles. Recarga la página y vuelve a agregarlos." },
        { status: 400 }
      );
    }

    const trackingToken = generateTrackingToken();
    const initialStatus = isAdminDraft ? "PENDING" : "PENDING_PAYMENT_CONFIRMATION";

    const order = await prisma.order.create({
      data: {
        trackingToken,
        customerName: isAdminDraft ? (name ?? "") : name,
        customerPhone: isAdminDraft ? (phone ?? "") : phone,
        customerEmail: email ?? "",
        address: isAdminDraft ? (address ?? "") : address,
        addressRef: addressRef ?? "",
        total,
        deliveryFee,
        estimatedTime: estimatedTime || "1 dia",
        adminNote: typeof adminNote === "string" ? adminNote.trim() || null : null,
        manualAdjustment: Number(manualAdjustment || 0),
        status: initialStatus,
        source: source === "ADMIN" ? "ADMIN" : "CLIENT",
        statusHistory: {
          create: {
            status: initialStatus,
            note:
              isAdminDraft
                ? "Pedido armado por el administrador. En espera de los datos y pago del cliente"
                : "Pedido creado por cliente y pendiente de validación de pago",
          },
        },
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            customization: item.customization ?? undefined,
            addons: {
              create: (item.addons || []).map((a: any) => ({
                addonId: a.id,
                price: a.price,
              })),
            },
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { include: { images: true, flowers: { include: { flower: true } } } },
            addons: { include: { addon: true } },
          },
        },
      },
    });

    Promise.all([
      sendPushToAdmins({
        type: "ORDER_CREATED",
        orderId: order.id,
        title: isAdminDraft ? "Link de pago generado" : "Nuevo pedido",
        body: isAdminDraft
          ? "El administrador generó un link de pago para un nuevo pedido."
          : `${name || "Cliente"} realizó un pedido por ${new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(total)}`,
        url: "/dashboard/todos-pedidos",
        data: {
          trackingToken,
          source: order.source,
          status: initialStatus,
        },
      }),
    ]).catch(console.error);

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        provider: true,
        visibleLabel: true,
        type: true,
        details: true,
        accountNumber: true,
        imageUrl: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paymentMethods,
      statusLabel: STATUS_LABELS[initialStatus] || initialStatus,
      checkoutUrl: `/checkout?token=${trackingToken}`,
    });
  } catch (e: any) {
    console.error("Order create error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const orders = await prisma.order.findMany({
    where: {
      status: statuses ? { in: statuses as any } : { notIn: ["DELIVERED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      paymentMethod: true,
      items: {
        include: {
          product: { include: { images: true, flowers: { include: { flower: true } } } },
          addons: { include: { addon: true } },
        },
      },
    },
  });
  return NextResponse.json(orders);
}
