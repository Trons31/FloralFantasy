import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file     = formData.get("file") as File;
  const orderId  = formData.get("orderId") as string;
  if (!file || !orderId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<any>((res, rej) =>
    cloudinary.uploader.upload_stream({ folder: "fantasiaFloral/entregas" },
      (err, r) => err ? rej(err) : res(r)
    ).end(buffer)
  );

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