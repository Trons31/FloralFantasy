import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStatusUpdate } from "@/lib/email";
import { STATUS_LABELS } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status, note } = await req.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      statusHistory: { create: { status, note: note || STATUS_LABELS[status] } },
    },
  });
  sendStatusUpdate({
    email: order.customerEmail, customerName: order.customerName,
    trackingToken: order.trackingToken, statusLabel: STATUS_LABELS[status],
  }).catch(console.error);
  return NextResponse.json(order);
}
