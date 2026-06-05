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
  if (access.kind === "operations" && !["CORREDOR", "REPARTIDOR"].includes(access.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData    = await req.formData();
  const file        = formData.get("file")        as File | null;
  const description = formData.get("description") as string;
  const amount      = formData.get("amount")      as string;
  const category    = formData.get("category")    as string;
  const registeredBy = formData.get("registeredBy") as string;

  if (!description || !amount) {
    return NextResponse.json({ error: "Descripción y monto son requeridos" }, { status: 400 });
  }

  let receiptPhotoUrl: string | undefined;
  let receiptPublicId: string | undefined;

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<any>((res, rej) =>
      cloudinary.uploader.upload_stream(
        { folder: "fantasiaFloral/facturas" },
        (err, r) => err ? rej(err) : res(r)
      ).end(buffer)
    );
    receiptPhotoUrl = result.secure_url;
    receiptPublicId = result.public_id;
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      amount:      parseFloat(amount),
      category:    category || "Insumos",
      date:        new Date(),
      receiptPhotoUrl,
      receiptPublicId,
      registeredBy,
    },
  });

  return NextResponse.json(expense);
}
