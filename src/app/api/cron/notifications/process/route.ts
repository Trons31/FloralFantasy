import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { processNotificationQueue, repairStuckNotificationOutbox } from "@/lib/webpush";

async function run(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const repaired = await repairStuckNotificationOutbox();
  const result = await processNotificationQueue();

  return NextResponse.json({
    ok: true,
    repaired,
    ...result,
    scheduleHint: "Programa este endpoint en cron-job.org cada 5 minutos.",
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
