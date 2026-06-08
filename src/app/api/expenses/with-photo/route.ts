import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { requireOrderManagementUser } from "@/lib/route-auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type ReceiptPhoto = { url: string; publicId?: string };

function uploadBufferToCloudinary(buffer: Buffer) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "gardentech/invoices" },
      (err, result) => (err ? reject(err) : resolve(result))
    ).end(buffer);
  });
}

export async function POST(req: NextRequest) {
  const access = await requireOrderManagementUser(req);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (access.kind === "operations" && !["CORREDOR", "REPARTIDOR"].includes(access.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const description = formData.get("description") as string;
  const amount = formData.get("amount") as string;
  const category = formData.get("category") as string;
  const registeredBy = formData.get("registeredBy") as string;
  const receiptPhotosRaw = formData.get("receiptPhotos") as string | null;

  if (!description || !amount) {
    return NextResponse.json({ error: "DescripciÃ³n y monto son requeridos" }, { status: 400 });
  }

  let receiptPhotos: ReceiptPhoto[] = [];

  if (receiptPhotosRaw) {
    try {
      const parsed = JSON.parse(receiptPhotosRaw);
      if (Array.isArray(parsed)) {
        receiptPhotos = parsed
          .filter((photo) => photo && typeof photo.url === "string" && photo.url.trim())
          .map((photo) => ({
            url: photo.url,
            publicId: typeof photo.publicId === "string" ? photo.publicId : undefined,
          }));
      }
    } catch {
      return NextResponse.json({ error: "Las fotos de la factura no son vÃ¡lidas" }, { status: 400 });
    }
  }

  if (!receiptPhotos.length && file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBufferToCloudinary(buffer);
    receiptPhotos = [{ url: result.secure_url, publicId: result.public_id }];
  }

  const storedPublicId =
    receiptPhotos.length > 1
      ? JSON.stringify(receiptPhotos)
      : receiptPhotos[0]?.publicId || null;

  const expense = await prisma.expense.create({
    data: {
      description,
      amount: parseFloat(amount),
      category: category || "Insumos",
      date: new Date(),
      receiptPhotoUrl: receiptPhotos[0]?.url,
      receiptPublicId: storedPublicId,
      registeredBy,
    } as any,
    select: {
      id: true,
      description: true,
      amount: true,
      category: true,
      date: true,
      createdAt: true,
      receiptPhotoUrl: true,
      receiptPublicId: true,
      registeredBy: true,
    },
  });

  return NextResponse.json(expense);
}
