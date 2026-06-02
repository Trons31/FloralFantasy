import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteImage, uploadImage } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1" || value === "on";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const current = await prisma.paymentMethod.findUnique({ where: { id: params.id } });
    if (!current) {
      return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
    }

    let imageUrl = current.imageUrl;
    let imagePublicId = current.imagePublicId;
    if (image && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json({ error: "La imagen debe ser válida" }, { status: 400 });
      }
      const bytes = await image.arrayBuffer();
      const base64 = `data:${image.type};base64,${Buffer.from(bytes).toString("base64")}`;
      const uploaded = await uploadImage(base64, { folder: "fantasiaFloral/metodos-pago" });
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
      if (current.imagePublicId && current.imagePublicId !== uploaded.publicId) {
        deleteImage(current.imagePublicId).catch(console.error);
      }
    }

    const updated = await prisma.paymentMethod.update({
      where: { id: params.id },
      data: {
        title: title || current.title,
        provider: provider || null,
        visibleLabel: visibleLabel || null,
        type: (type || current.type) as any,
        details: details || null,
        accountNumber: accountNumber || null,
        imageUrl,
        imagePublicId,
        isActive,
        sortOrder,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Payment method update error:", error);
    return NextResponse.json({ error: "No se pudo actualizar el método de pago" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const current = await prisma.paymentMethod.findUnique({ where: { id: params.id } });
    if (!current) {
      return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
    }

    await prisma.order.updateMany({
      where: { paymentMethodId: params.id },
      data: { paymentMethodId: null },
    });

    if (current.imagePublicId) {
      await deleteImage(current.imagePublicId).catch(console.error);
    }

    await prisma.paymentMethod.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Payment method delete error:", error);
    return NextResponse.json({ error: "No se pudo eliminar el método de pago" }, { status: 500 });
  }
}
