import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1" || value === "on";
}

export async function GET() {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(methods);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title = String(formData.get("title") || "").trim();
    const provider = String(formData.get("provider") || "").trim();
    const visibleLabel = String(formData.get("visibleLabel") || "").trim();
    const type = String(formData.get("type") || "");
    const details = String(formData.get("details") || "").trim();
    const accountNumber = String(formData.get("accountNumber") || "").trim();
    const image = formData.get("file") as File | null;
    const isActive = parseBoolean(formData.get("isActive"));
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (!title || !type) {
      return NextResponse.json({ error: "Título y tipo son obligatorios" }, { status: 400 });
    }

    let imageData: { url: string; publicId: string } | null = null;
    if (image && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json({ error: "La imagen debe ser válida" }, { status: 400 });
      }
      const bytes = await image.arrayBuffer();
      const base64 = `data:${image.type};base64,${Buffer.from(bytes).toString("base64")}`;
      imageData = await uploadImage(base64, { folder: "fantasiaFloral/metodos-pago" });
    }

    const method = await prisma.paymentMethod.create({
      data: {
        title,
        provider: provider || null,
        visibleLabel: visibleLabel || null,
        type: type as any,
        details: details || null,
        accountNumber: accountNumber || null,
        imageUrl: imageData?.url || null,
        imagePublicId: imageData?.publicId || null,
        isActive,
        sortOrder,
      },
    });

    return NextResponse.json(method);
  } catch (error: any) {
    console.error("Payment method create error:", error);
    return NextResponse.json({ error: "No se pudo crear el método de pago" }, { status: 500 });
  }
}
