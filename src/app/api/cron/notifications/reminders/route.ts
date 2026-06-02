import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { enqueuePaymentReminderNotifications } from "@/lib/webpush";

async function run(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const enqueued = await enqueuePaymentReminderNotifications();

  return NextResponse.json({
    ok: true,
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
