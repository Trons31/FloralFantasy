import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { enqueuePaymentReminderNotifications } from "@/lib/webpush";
import { expireStalePendingOrders } from "@/lib/pending-order-server";

async function run(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Spec 017: primero vencen los pedidos sin pago de más de 1 h, así no
  // generan recordatorios.
  const { expired } = await expireStalePendingOrders();
  const enqueued = await enqueuePaymentReminderNotifications();

  return NextResponse.json({
    ok: true,
    expired,
    enqueued: enqueued.enqueued,
    scheduleHint: "Programa este endpoint en cron-job.org cada 30 minutos.",
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
