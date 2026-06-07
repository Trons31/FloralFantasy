import { NextRequest, NextResponse } from "next/server";
import { getAccountingSummary } from "@/lib/accounting";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "day" ? "day" : "month";
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
  const dayParam = searchParams.get("day");
  const day = dayParam ? Number(dayParam) : undefined;

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const summary = await getAccountingSummary({ mode, year, month, day });
  return NextResponse.json(summary);
}
