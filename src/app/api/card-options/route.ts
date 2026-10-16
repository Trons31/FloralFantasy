import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
import { cardOptionSelect, parseCardOptionInput } from "@/lib/card-options";

// Público: opciones activas para la ficha. Con `?all=1` (solo admin) incluye
// las inactivas para el panel.
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  if (all && !(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const options = await prisma.cardOption.findMany({
    where: all ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    // La tienda solo necesita lo que muestra; el panel recibe todo.
    select: all
      ? cardOptionSelect
      : { id: true, name: true, description: true, price: true, maxChars: true, imageUrl: true },
  });
  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = parseCardOptionInput(await req.json().catch(() => null), true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const last = await prisma.cardOption.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const created = await prisma.cardOption.create({
      data: { sortOrder: (last?.sortOrder ?? -1) + 1, ...parsed.data, name: parsed.data.name! },
      select: cardOptionSelect,
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "No fue posible crear la tarjeta" }, { status: 500 });
  }
}
