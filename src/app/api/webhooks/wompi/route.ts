import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("x-event-checksum") || "";
  const expected = crypto.createHash("sha256").update(body + (process.env.WOMPI_EVENTS_SECRET || "")).digest("hex");
  if (expected !== sig) return NextResponse.json({ error: "Invalid sig" }, { status: 401 });
  const event = JSON.parse(body);
  if (event.event === "transaction.updated" && event.data.transaction.status === "APPROVED") {
    await prisma.order.update({
      where: { id: event.data.transaction.reference },
      data: {
        status: "PAID", wompiTxId: event.data.transaction.id,
        statusHistory: { create: { status: "PAID", note: "Pago confirmado por Wompi" } },
      },
    });
  }
  return NextResponse.json({ ok: true });
}
