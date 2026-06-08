import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { requireOrderManagementUser } from "@/lib/route-auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireOrderManagementUser(req);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (access.kind === "operations" && access.user.role !== "CORREDOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const description = formData.get("description") as string;
  const amount      = formData.get("amount")      as string;
  const category    = formData.get("category")    as string;
  const file        = formData.get("file")        as File | null;
  const receiptPhotosRaw = formData.get("receiptPhotos") as string | null;

  if (!description?.trim() || !amount)
    return NextResponse.json({ error: "Descripción y monto requeridos" }, { status: 400 });

  const data: any = {
    description: description.trim(),
    amount:      parseFloat(amount),
    category,
  };

  if (receiptPhotosRaw) {
    try {
      const parsed = JSON.parse(receiptPhotosRaw);
      if (Array.isArray(parsed)) {
        const receiptPhotos = parsed
          .filter((photo) => photo && typeof photo.url === "string" && photo.url.trim())
          .map((photo) => ({
            url: photo.url,
            publicId: typeof photo.publicId === "string" ? photo.publicId : undefined,
          }));
        data.receiptPhotos = receiptPhotos;
        data.receiptPhotoUrl = receiptPhotos[0]?.url ?? null;
        data.receiptPublicId = receiptPhotos[0]?.publicId ?? null;
      }
    } catch {
      return NextResponse.json({ error: "Las fotos de la factura no son válidas" }, { status: 400 });
    }
  } else if (file && file.size > 0) {
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const upload: any = await new Promise((resolve, reject) =>
      cloudinary.uploader.upload_stream(
        { folder: "gardentech/invoices" },
        (err, res) => err ? reject(err) : resolve(res)
      ).end(buffer)
    );
    data.receiptPhotoUrl    = upload.secure_url;
    data.receiptPublicId    = upload.public_id;
    data.receiptPhotos      = [{ url: upload.secure_url, publicId: upload.public_id }];
  }

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireOrderManagementUser(_);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (access.kind === "operations" && access.user.role !== "CORREDOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const expense = await prisma.expense.findUnique({ where: { id: params.id } });

  const receiptPhotos = Array.isArray((expense as any)?.receiptPhotos) ? (expense as any).receiptPhotos : [];
  const publicIds = [
    ...(expense?.receiptPublicId ? [expense.receiptPublicId] : []),
    ...receiptPhotos.map((photo: any) => photo?.publicId).filter(Boolean),
  ];

  for (const publicId of Array.from(new Set(publicIds))) {
    await cloudinary.uploader.destroy(publicId).catch(() => {});
  }

  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
