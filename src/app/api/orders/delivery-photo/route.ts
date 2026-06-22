import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteImage, uploadImage } from "@/lib/cloudinary";
import { optimizeImageFileToDataUrl } from "@/lib/image-optimization";
import { requireOrderManagementUser } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  const access = await requireOrderManagementUser(req);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (access.kind === "operations" && access.user.role !== "REPARTIDOR") {
    return NextResponse.json({ error: "No autorizado para confirmar entregas" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const orderId = String(formData.get("orderId") || "");
  if (!file || !orderId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "La foto debe ser una imagen válida" }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen supera el límite permitido" }, { status: 400 });
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, deliveryPhotoPublicId: true },
  });
  if (!existingOrder) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const result = await uploadImage(await optimizeImageFileToDataUrl(file), {
    folder: "gardentech/deliveries",
    transformation: [],
  });

  if (existingOrder.deliveryPhotoPublicId && existingOrder.deliveryPhotoPublicId !== result.publicId) {
    await deleteImage(existingOrder.deliveryPhotoPublicId).catch(() => {});
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryPhotoUrl: result.url,
      deliveryPhotoPublicId: result.publicId,
      status: "DELIVERED",
      statusHistory: { create: { status: "DELIVERED", note: "Entregado con foto de evidencia" } },
    },
  });

  return NextResponse.json({ url: result.url, order });
}
