import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
import { deleteImage } from "@/lib/cloudinary";

type OccasionImageInput = {
  url?: string;
  publicId?: string | null;
  isMain?: boolean;
  order?: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeImages(images: OccasionImageInput[] | undefined) {
  const safe = Array.isArray(images)
    ? images
        .map((img, index) => ({
          url: String(img?.url || "").trim(),
          publicId: img?.publicId ? String(img.publicId).trim() : null,
          isMain: Boolean(img?.isMain),
          order: Number.isFinite(Number(img?.order)) ? Number(img?.order) : index,
        }))
        .filter((img) => Boolean(img.url))
    : [];

  if (safe.length === 0) return [];
  const mainIndex = Math.max(0, safe.findIndex((img) => img.isMain));
  return safe
    .sort((a, b) => a.order - b.order)
    .map((img, index) => ({
      ...img,
      order: index,
      isMain: index === mainIndex,
    }));
}

async function syncImages(occasionId: string, nextImages: ReturnType<typeof normalizeImages>) {
  const current = await prisma.occasionImage.findMany({
    where: { occasionId },
    select: { id: true, url: true, publicId: true },
  });

  const nextKeys = new Set(nextImages.map((img) => img.publicId || img.url));
  const toDelete = current.filter((img) => !nextKeys.has(img.publicId || img.url));

  await Promise.all(
    toDelete
      .filter((img) => img.publicId)
      .map((img) => deleteImage(img.publicId!))
  );

  await prisma.occasionImage.deleteMany({ where: { occasionId } });
  await prisma.occasionImage.createMany({
    data: nextImages.map((img) => ({
      occasionId,
      url: img.url,
      publicId: img.publicId || null,
      isMain: img.isMain,
      order: img.order,
    })),
  });
}

async function serializeOccasion(id: string) {
  return prisma.occasion.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });
}

export async function GET(req: NextRequest) {
  if (!(await requireAdminUser(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const occasions = await prisma.occasion.findMany({
    include: { images: { orderBy: { order: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(occasions);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminUser(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const slug = String(body?.slug || "").trim() || slugify(name);
    const subtitle = String(body?.subtitle || "").trim() || null;
    const advanceOrderDays = Math.max(0, Number(body?.advanceOrderDays || 0));
    const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0;
    const isActive = body?.isActive !== false && body?.isActive !== "false";
    const images = normalizeImages(body?.images);

    if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "El slug es obligatorio" }, { status: 400 });
    if (images.length === 0) return NextResponse.json({ error: "Agrega al menos una imagen" }, { status: 400 });

    const created = await prisma.occasion.create({
      data: {
        name,
        slug,
        subtitle,
        advanceOrderDays,
        sortOrder,
        isActive,
        images: {
          create: images.map((img) => ({
            url: img.url,
            publicId: img.publicId || null,
            isMain: img.isMain,
            order: img.order,
          })),
        },
      },
      include: { images: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const message =
      error?.code === "P2002"
        ? "Ya existe una ocasión con ese slug"
        : error?.message || "No fue posible crear la ocasión";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

