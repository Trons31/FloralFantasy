import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { requireOrderManagementUser } from "@/lib/route-auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen supera el límite permitido" }, { status: 400 });
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, deliveryPhotoPublicId: true },
  });
  if (!existingOrder) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<any>((res, rej) =>
    cloudinary.uploader.upload_stream({ folder: "fantasiaFloral/entregas" },
      (err, r) => err ? rej(err) : res(r)
    ).end(buffer)
  );

  if (existingOrder.deliveryPhotoPublicId && existingOrder.deliveryPhotoPublicId !== result.public_id) {
    await cloudinary.uploader.destroy(existingOrder.deliveryPhotoPublicId).catch(() => {});
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryPhotoUrl: result.secure_url,
      deliveryPhotoPublicId: result.public_id,
      status: "DELIVERED",
      statusHistory: { create: { status: "DELIVERED", note: "Entregado con foto de evidencia" } },
    },
  });

  return NextResponse.json({ url: result.secure_url, order });
}
