import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
import { formatDeliveryLeadDays, maxDeliveryLeadDays } from "@/lib/utils";

async function getOrderDetails(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      paymentMethod: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      items: {
        include: {
          product: { include: { images: true, flowers: { include: { flower: true } } } },
          addons: { include: { addon: true } },
        },
      },
    },
  });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const order = await getOrderDetails(params.id);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      address,
      addressRef,
      items,
      deliveryFee,
      manualAdjustment,
      adminNote,
      paymentMethodId,
    } = body ?? {};

    if (!customerName?.trim() || !customerPhone?.trim() || !address?.trim()) {
      return NextResponse.json({ error: "Cliente, teléfono y dirección son requeridos" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Debes agregar al menos un producto" }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const productIds = items.map((item: any) => item.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { flowers: { include: { flower: true } } },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const missingProducts = productIds.filter((id: string) => !productMap.has(id));
    if (missingProducts.length > 0) {
      return NextResponse.json({ error: "Uno o más productos ya no están disponibles" }, { status: 400 });
    }

    const addonIds = Array.from(
      new Set(
        items.flatMap((item: any) =>
          Array.isArray(item.addons) ? item.addons.map((addon: any) => addon.id).filter(Boolean) : []
        )
      )
    );

    const addons = addonIds.length
      ? await prisma.addOn.findMany({
          where: { id: { in: addonIds }, inStock: true },
          select: { id: true, price: true, inStock: true },
        })
      : [];

    const addonMap = new Map(addons.map((addon) => [addon.id, addon]));
    const missingAddons = addonIds.filter((id: string) => !addonMap.has(id));
    if (missingAddons.length > 0) {
      return NextResponse.json({ error: "Uno o más adicionales ya no están disponibles" }, { status: 400 });
    }

    if (paymentMethodId) {
      const method = await prisma.paymentMethod.findFirst({
        where: { id: paymentMethodId, isActive: true },
        select: { id: true },
      });
      if (!method) {
        return NextResponse.json({ error: "Método de pago no válido" }, { status: 400 });
      }
    }

    let subtotal = 0;
    const normalizedItems = items.map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = Number(product.price || 0);
      const normalizedAddons = Array.isArray(item.addons)
        ? item.addons
            .map((addon: any) => addonMap.get(addon.id))
            .filter(Boolean)
            .map((addon: any) => ({ addonId: addon.id, price: Number(addon.price || 0) }))
        : [];
      const addonTotal = normalizedAddons.reduce((sum: number, addon: { addonId: string; price: number }) => sum + addon.price, 0);
      subtotal += (price + addonTotal) * quantity;

      return {
        productId: product.id,
        quantity,
        price,
        customization: item.customization ?? undefined,
        addons: {
          create: normalizedAddons,
        },
      };
    });

    const normalizedDeliveryFee = Math.max(0, Number(deliveryFee ?? 0));
    const normalizedManualAdjustment = Number(manualAdjustment ?? 0);
    const total = subtotal + normalizedDeliveryFee + normalizedManualAdjustment;
    const deliveryLead = maxDeliveryLeadDays(
      products.map((product) => ({
        deliveryLeadDays: product.deliveryLeadDays,
      }))
    );
    const estimatedTime = deliveryLead.label || formatDeliveryLeadDays(0);
    const cleanAdminNote = typeof adminNote === "string" ? adminNote.trim() || null : null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.orderItemAddOn.deleteMany({
        where: {
          orderItem: {
            orderId: params.id,
          },
        },
      });
      await tx.orderItem.deleteMany({
        where: { orderId: params.id },
      });

      await tx.order.update({
        where: { id: params.id },
        data: {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: String(customerEmail || "").trim(),
          address: address.trim(),
          addressRef: String(addressRef || "").trim() || null,
          total,
          deliveryFee: normalizedDeliveryFee,
          estimatedTime,
          adminNote: cleanAdminNote,
          manualAdjustment: normalizedManualAdjustment,
          paymentMethodId: paymentMethodId || null,
          statusHistory: {
            create: {
              status: existingOrder.status,
              note: "Pedido editado por el administrador",
            },
          },
          items: {
            create: normalizedItems,
          },
        },
      });

      return getOrderDetails(params.id);
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "No fue posible actualizar el pedido" }, { status: 500 });
  }
}
