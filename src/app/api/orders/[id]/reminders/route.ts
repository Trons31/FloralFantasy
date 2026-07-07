import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { queueNotification } from "@/lib/notifications/service";
import { requireAdminUser } from "@/lib/route-auth";

const RECIPIENT_LABELS: Record<string, string> = {
  me: "mi cuenta",
  admins: "administradores",
  preparadores: "preparadores",
  repartidores: "repartidores",
};

function normalizeDelayMinutes(value: unknown) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return null;
  return Math.max(1, Math.min(Math.round(minutes), 60 * 24 * 30));
}

function getNextBogotaTime(timeOfDay: unknown) {
  const value = String(timeOfDay || "").trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const now = new Date();
  const bogotaOffsetHours = 5;
  const bogotaNow = new Date(now.getTime() - bogotaOffsetHours * 60 * 60 * 1000);
  let scheduledAt = new Date(Date.UTC(
    bogotaNow.getUTCFullYear(),
    bogotaNow.getUTCMonth(),
    bogotaNow.getUTCDate(),
    hour + bogotaOffsetHours,
    minute,
    0,
    0
  ));

  if (scheduledAt <= now) {
    scheduledAt = new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000);
  }

  return scheduledAt;
}

function resolveReminderDate(body: any) {
  const mode = String(body?.scheduleMode || "").trim();
  const timeOfDay = getNextBogotaTime(body?.timeOfDay);
  const delayMinutes = normalizeDelayMinutes(body?.delayMinutes);

  if (mode === "time") {
    return timeOfDay;
  }

  if (mode === "delay") {
    return delayMinutes ? new Date(Date.now() + delayMinutes * 60_000) : null;
  }

  if (timeOfDay) return timeOfDay;
  if (delayMinutes) return new Date(Date.now() + delayMinutes * 60_000);
  return null;
}

async function getReminderRecipients(recipient: string, adminId: string) {
  if (recipient === "me") {
    return prisma.user.findMany({
      where: { id: adminId },
      select: { id: true },
    });
  }

  if (recipient === "admins") {
    return prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
      select: { id: true },
    });
  }

  if (recipient === "preparadores") {
    return prisma.user.findMany({
      where: { role: Role.PREPARADOR },
      select: { id: true },
    });
  }

  if (recipient === "repartidores") {
    return prisma.user.findMany({
      where: { role: Role.REPARTIDOR },
      select: { id: true },
    });
  }

  return [];
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminUser();
  if (!admin?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const note = String(body?.note || "").trim();
  const recipient = String(body?.recipient || "me").trim();
  const availableAt = resolveReminderDate(body);

  if (!note) {
    return NextResponse.json({ error: "La nota del recordatorio es requerida" }, { status: 400 });
  }

  if (!availableAt) {
    return NextResponse.json({ error: "El tiempo del recordatorio no es válido" }, { status: 400 });
  }

  if (!RECIPIENT_LABELS[recipient]) {
    return NextResponse.json({ error: "Destinatario inválido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      trackingToken: true,
      customerName: true,
      status: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const recipients = await getReminderRecipients(recipient, admin.id);
  if (!recipients.length) {
    return NextResponse.json({ error: "No hay usuarios para ese destinatario" }, { status: 404 });
  }

  const createdAt = new Date().toISOString();
  const results = [];

  for (const user of recipients) {
    results.push(
      await queueNotification({
        userId: user.id,
        type: "ORDER_SPECIAL_REMINDER",
        title: `Recordatorio pedido #${order.trackingToken}`,
        body: note,
        orderId: order.id,
        dedupeKey: `order:${order.id}:special-reminder:${recipient}:${user.id}:${createdAt}`,
        availableAt,
        payload: {
          url: recipient === "me" || recipient === "admins" ? `/dashboard/pedidos/${order.id}` : "/operaciones",
          data: {
            trackingToken: order.trackingToken,
            customerName: order.customerName,
            orderStatus: order.status,
            recipient,
            reminderNote: note,
            availableAt: availableAt.toISOString(),
          },
        },
      })
    );
  }

  return NextResponse.json({
    ok: true,
    scheduledFor: availableAt.toISOString(),
    recipient,
    recipientLabel: RECIPIENT_LABELS[recipient],
    count: results.length,
  });
}
