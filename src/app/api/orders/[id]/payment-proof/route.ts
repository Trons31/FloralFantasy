import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { sendOrderConfirmation } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/webpush";

function isValidImage(file: File) {
  return file.type.startsWith("image/");
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const trackingToken = String(formData.get("trackingToken") || "");
    const paymentMethodId = String(formData.get("paymentMethodId") || "");
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const addressRef = String(formData.get("addressRef") || "").trim();

    if (!file || !trackingToken) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (!isValidImage(file)) {
      return NextResponse.json({ error: "El comprobante debe ser una imagen válida" }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen supera el límite permitido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        trackingToken: true,
        paymentProofPublicId: true,
      },
    });

    if (!order || order.trackingToken !== trackingToken) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
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

    const bytes = await file.arrayBuffer();
    const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
    const result = await uploadImage(base64, {
      folder: "fantasiaFloral/comprobantes",
    });

    if (order.paymentProofPublicId && order.paymentProofPublicId !== result.publicId) {
      deleteImage(order.paymentProofPublicId).catch(console.error);
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        customerName: name || undefined,
        customerPhone: phone || undefined,
        customerEmail: email || undefined,
        address: address || undefined,
        addressRef: addressRef || undefined,
        paymentMethodId: paymentMethodId || undefined,
        paymentProofUrl: result.url,
        paymentProofPublicId: result.publicId,
        status: "PENDING_PAYMENT_CONFIRMATION",
        statusHistory: {
          create: {
            status: "PENDING_PAYMENT_CONFIRMATION",
            note: "Comprobante cargado por el cliente. Pendiente de validación",
          },
        },
      },
      include: {
        paymentMethod: true,
        items: {
          include: {
            product: { include: { images: true } },
            addons: { include: { addon: true } },
          },
        },
      },
    });

    sendPushToAdmins({
      type: "PAYMENT_PROOF_UPLOADED",
      orderId: updated.id,
      title: "Comprobante recibido",
      body: `${updated.customerName} cargó el comprobante y espera validación`,
      url: "/dashboard/todos-pedidos",
      data: {
        trackingToken: updated.trackingToken,
        status: updated.status,
      },
    }).catch(console.error);

    if (updated.customerEmail) {
      sendOrderConfirmation({
        email: updated.customerEmail,
        customerName: updated.customerName,
        trackingToken: updated.trackingToken,
        total: updated.total,
        estimatedTime: updated.estimatedTime,
      }).catch(console.error);
    }

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Payment proof upload error:", error);
    return NextResponse.json({ error: "No fue posible cargar el comprobante" }, { status: 500 });
  }
}
