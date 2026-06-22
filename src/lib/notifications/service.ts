import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationQueueStatus,
  NotificationStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendWebPushToUser } from "@/lib/push-notifications";
import type {
  QueueNotificationInput,
  QueueNotificationsResult,
  TransportDispatchResult,
} from "@/lib/notifications/types";

const MAX_PROCESSING_ATTEMPTS = 5;
const STALE_PROCESSING_MINUTES = 5;
const DEFAULT_SYNC_LIMIT = 50;
const REMINDER_INTERVAL_MINUTES = 30;

type NotificationPayload = {
  url?: string;
  screen?: string;
  data?: Record<string, string>;
};

function serializePayload(payload?: NotificationPayload): Prisma.InputJsonValue | undefined {
  if (!payload) return undefined;

  const normalized: Record<string, Prisma.InputJsonValue> = {};
  if (payload.url) normalized.url = payload.url;
  if (payload.screen) normalized.screen = payload.screen;
  if (payload.data) normalized.data = payload.data;

  return Object.keys(normalized).length ? (normalized as Prisma.InputJsonValue) : undefined;
}

function parsePayload(payload: Prisma.JsonValue | null): NotificationPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};

  const record = payload as Record<string, Prisma.JsonValue>;
  const data =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? Object.fromEntries(
          Object.entries(record.data as Record<string, Prisma.JsonValue>).map(([key, value]) => [
            key,
            String(value ?? ""),
          ])
        )
      : undefined;

  return {
    url: typeof record.url === "string" ? record.url : undefined,
    screen: typeof record.screen === "string" ? record.screen : undefined,
    data,
  };
}

function buildRetryDate(attemptCount: number) {
  const baseDelayMinutes = Math.min(60, Math.max(1, 2 ** Math.max(0, attemptCount - 1)));
  const jitterSeconds = Math.floor(Math.random() * 30);
  return new Date(Date.now() + baseDelayMinutes * 60_000 + jitterSeconds * 1000);
}

async function upsertDeliveryResult(
  notificationId: string,
  channel: NotificationChannel,
  attempt: number,
  result: TransportDispatchResult,
  deliveredAt?: Date
) {
  const now = new Date();
  const status = !result.attempted
    ? NotificationDeliveryStatus.SKIPPED
    : result.success
      ? deliveredAt
        ? NotificationDeliveryStatus.DELIVERED
        : NotificationDeliveryStatus.SENT
      : NotificationDeliveryStatus.FAILED;

  await prisma.notificationDelivery.upsert({
    where: {
      notificationId_channel: {
        notificationId,
        channel,
      },
    },
    create: {
      notificationId,
      channel,
      attempt,
      status,
      providerMessageId: result.providerMessageId ?? null,
      lastError: result.error ?? null,
      sentAt: result.success ? now : null,
      deliveredAt: deliveredAt ?? null,
      failedAt: !result.success && result.attempted ? now : null,
    },
    update: {
      attempt,
      status,
      providerMessageId: result.providerMessageId ?? undefined,
      lastError: result.error ?? null,
      sentAt: result.success ? now : undefined,
      deliveredAt: deliveredAt ?? undefined,
      failedAt: !result.success && result.attempted ? now : undefined,
    },
  });
}

async function tryAcquireUserLock(userId: string) {
  const result = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(hashtext(${userId})) AS locked
  `;

  return Boolean(result[0]?.locked);
}

async function releaseUserLock(userId: string) {
  await prisma.$executeRaw`
    SELECT pg_advisory_unlock(hashtext(${userId}))
  `;
}

async function processSingleOutboxEntry(entryId: string) {
  const now = new Date();

  const claimed = await prisma.notificationOutbox.updateMany({
    where: {
      id: entryId,
      status: { in: [NotificationQueueStatus.QUEUED, NotificationQueueStatus.RETRYING] },
      nextAttemptAt: { lte: now },
    },
    data: {
      status: NotificationQueueStatus.PROCESSING,
      processingStartedAt: now,
      lastAttemptAt: now,
      attemptCount: { increment: 1 },
    },
  });

  if (!claimed.count) {
    return { processed: false, sent: false, retried: false, failed: false };
  }

  const outbox = await prisma.notificationOutbox.findUnique({
    where: { id: entryId },
    include: {
      notification: {
        select: {
          id: true,
          userId: true,
          title: true,
          body: true,
          payload: true,
          status: true,
          type: true,
          orderId: true,
        },
      },
    },
  });

  if (!outbox?.notification) {
    return { processed: false, sent: false, retried: false, failed: false };
  }

  await prisma.notification.update({
    where: { id: outbox.notificationId },
    data: {
      status: NotificationStatus.PROCESSING,
      lastError: null,
    },
  });

  try {
    if (outbox.notification.type === "PAYMENT_REMINDER" && outbox.notification.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: outbox.notification.orderId },
        select: { status: true },
      });

      if (!order || order.status !== "PENDING_PAYMENT_CONFIRMATION") {
        await prisma.notificationOutbox.update({
          where: { id: outbox.id },
          data: {
            status: NotificationQueueStatus.SENT,
            processingStartedAt: null,
            sentAt: new Date(),
            lastError: "Pedido ya validado o no encontrado",
          },
        });

        await prisma.notification.update({
          where: { id: outbox.notificationId },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            lastError: "Pedido ya validado o no encontrado",
          },
        });

        return { processed: true, sent: true, retried: false, failed: false };
      }
    }

    const payload = parsePayload(outbox.notification.payload);
    const pushPayload = {
      title: outbox.notification.title,
      body: outbox.notification.body,
      icon: "/flowers/logo.png",
      url: payload.url || "/dashboard/todos-pedidos",
      data: {
        notificationId: outbox.notification.id,
        ...((payload.data as Record<string, string>) ?? {}),
      },
    };

    const result = await sendWebPushToUser(outbox.notification.userId, pushPayload);
    await upsertDeliveryResult(outbox.notificationId, NotificationChannel.WEB_PUSH, outbox.attemptCount, result);

    if (result.attempted && !result.success && !result.permanentFailure) {
      throw new Error(result.error || "No se pudo enviar la notificación por Web Push");
    }

    await prisma.notificationOutbox.update({
      where: { id: outbox.id },
      data: {
        status: NotificationQueueStatus.SENT,
        processingStartedAt: null,
        sentAt: new Date(),
        lastError: result.success || !result.attempted || result.permanentFailure ? null : result.error,
      },
    });

    await prisma.notification.update({
      where: { id: outbox.notificationId },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        lastError: result.success || !result.attempted || result.permanentFailure ? null : result.error,
      },
    });

    return { processed: true, sent: true, retried: false, failed: false };
  } catch (error) {
    const attemptCount = outbox.attemptCount;
    const message = error instanceof Error ? error.message : "No se pudo procesar la notificación";
    const exhausted = attemptCount >= MAX_PROCESSING_ATTEMPTS;

    await prisma.notificationOutbox.update({
      where: { id: outbox.id },
      data: exhausted
        ? {
            status: NotificationQueueStatus.FAILED,
            processingStartedAt: null,
            lastError: message,
          }
        : {
            status: NotificationQueueStatus.RETRYING,
            processingStartedAt: null,
            nextAttemptAt: buildRetryDate(attemptCount),
            lastError: message,
          },
    });

    await prisma.notification.update({
      where: { id: outbox.notificationId },
      data: {
        status: exhausted ? NotificationStatus.FAILED : NotificationStatus.RETRYING,
        lastError: message,
      },
    });

    return { processed: true, sent: false, retried: !exhausted, failed: exhausted };
  }
}

async function processUserQueue(userId: string, limit: number) {
  const summary = { processed: 0, sent: 0, retried: 0, failed: 0 };

  while (summary.processed < limit) {
    const candidates = await prisma.notificationOutbox.findMany({
      where: {
        userId,
        status: { in: [NotificationQueueStatus.QUEUED, NotificationQueueStatus.RETRYING] },
        nextAttemptAt: { lte: new Date() },
      },
      select: {
        id: true,
        notification: {
          select: {
            sequence: true,
          },
        },
      },
      take: limit,
    });

    if (!candidates.length) break;

    candidates.sort((left, right) => left.notification.sequence - right.notification.sequence);

    const nextEntry = candidates[0];
    const result = await processSingleOutboxEntry(nextEntry.id);

    if (!result.processed) break;

    summary.processed += 1;
    if (result.sent) summary.sent += 1;
    if (result.retried) summary.retried += 1;
    if (result.failed) summary.failed += 1;
  }

  return summary;
}

async function getAdminRecipients() {
  return prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
    select: { id: true, role: true, name: true, email: true },
  });
}

async function getRecipientsByRoles(roles: Role[]) {
  return prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true, role: true, name: true, email: true },
  });
}

export async function queueNotification(
  input: QueueNotificationInput
): Promise<QueueNotificationsResult> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    if (input.dedupeKey) {
      const existing = await tx.notification.findUnique({
        where: {
          userId_dedupeKey: {
            userId: input.userId,
            dedupeKey: input.dedupeKey,
          },
        },
        select: {
          id: true,
          userId: true,
          sequence: true,
          status: true,
        },
      });

      if (existing) {
        return {
          notificationId: existing.id,
          userId: existing.userId,
          sequence: existing.sequence,
          status: existing.status,
          deduped: true,
        };
      }
    }

    const state = await tx.userNotificationState.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        lastSequence: 1,
      },
      update: {
        lastSequence: {
          increment: 1,
        },
      },
      select: {
        lastSequence: true,
      },
    });

    try {
      const notification = await tx.notification.create({
        data: {
          userId: input.userId,
          orderId: input.orderId ?? undefined,
          sequence: state.lastSequence,
          type: input.type,
          title: input.title,
          body: input.body,
          payload: serializePayload(input.payload),
          dedupeKey: input.dedupeKey ?? null,
          status: NotificationStatus.QUEUED,
          queuedAt: now,
        },
        select: {
          id: true,
          userId: true,
          sequence: true,
          status: true,
        },
      });

      await tx.notificationOutbox.create({
        data: {
          notificationId: notification.id,
          userId: input.userId,
          status: NotificationQueueStatus.QUEUED,
          nextAttemptAt: now,
        },
      });

      await tx.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel: NotificationChannel.INBOX_SYNC,
          status: NotificationDeliveryStatus.SENT,
          attempt: 1,
          sentAt: now,
        },
      });

      return {
        notificationId: notification.id,
        userId: notification.userId,
        sequence: notification.sequence,
        status: notification.status,
        deduped: false,
      };
    } catch (error) {
      if (
        input.dedupeKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await tx.notification.findUnique({
          where: {
            userId_dedupeKey: {
              userId: input.userId,
              dedupeKey: input.dedupeKey,
            },
          },
          select: {
            id: true,
            userId: true,
            sequence: true,
            status: true,
          },
        });

        if (existing) {
          return {
            notificationId: existing.id,
            userId: existing.userId,
            sequence: existing.sequence,
            status: existing.status,
            deduped: true,
          };
        }
      }

      throw error;
    }
  });
}

export async function queueNotifications(inputs: QueueNotificationInput[]) {
  const results: QueueNotificationsResult[] = [];

  for (const input of inputs) {
    results.push(await queueNotification(input));
  }

  return results;
}

export async function sendPushToAdmins(payload: {
  type: string;
  title: string;
  body: string;
  url?: string;
  orderId?: string | null;
  dedupeKey?: string;
  data?: Record<string, string>;
  availableAt?: Date;
  maxAttempts?: number;
}) {
  const admins = await getAdminRecipients();
  const results: QueueNotificationsResult[] = [];

  for (const admin of admins) {
    results.push(
      await queueNotification({
        userId: admin.id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        orderId: payload.orderId ?? null,
        dedupeKey:
          payload.dedupeKey ??
          [`admin-notification`, admin.id, payload.type, payload.orderId ?? payload.title].join(":"),
        payload: {
          url: payload.url || "/dashboard/todos-pedidos",
          data: payload.data,
        },
        availableAt: payload.availableAt,
        maxAttempts: payload.maxAttempts,
      })
    );
  }

  return results;
}

export async function sendPushToRoles(
  roles: Role[],
  payload: {
    type: string;
    title: string;
    body: string;
    url?: string;
    orderId?: string | null;
    dedupeKey?: string;
    data?: Record<string, string>;
    availableAt?: Date;
    maxAttempts?: number;
  }
) {
  const recipients = await getRecipientsByRoles(roles);
  const results: QueueNotificationsResult[] = [];

  for (const recipient of recipients) {
    results.push(
      await queueNotification({
        userId: recipient.id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        orderId: payload.orderId ?? null,
        dedupeKey:
          payload.dedupeKey ??
          [`role-notification`, recipient.id, payload.type, payload.orderId ?? payload.title].join(":"),
        payload: {
          url: payload.url || "/operaciones",
          data: payload.data,
        },
        availableAt: payload.availableAt,
        maxAttempts: payload.maxAttempts,
      })
    );
  }

  return results;
}

export async function repairStuckNotificationOutbox() {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60_000);

  const repaired = await prisma.notificationOutbox.updateMany({
    where: {
      status: NotificationQueueStatus.PROCESSING,
      processingStartedAt: {
        lt: staleBefore,
      },
    },
    data: {
      status: NotificationQueueStatus.RETRYING,
      processingStartedAt: null,
      nextAttemptAt: new Date(),
      lastError: "Procesamiento recuperado por el job de reparacion",
    },
  });

  if (repaired.count) {
    await prisma.notification.updateMany({
      where: {
        outbox: {
          is: {
            status: NotificationQueueStatus.RETRYING,
            processingStartedAt: null,
            lastError: "Procesamiento recuperado por el job de reparacion",
          },
        },
        status: NotificationStatus.PROCESSING,
      },
      data: {
        status: NotificationStatus.RETRYING,
        lastError: "Procesamiento recuperado por el job de reparacion",
      },
    });
  }

  return repaired.count;
}

export async function processNotificationOutboxBatch(limit = 100) {
  const dueEntries = await prisma.notificationOutbox.findMany({
    where: {
      status: { in: [NotificationQueueStatus.QUEUED, NotificationQueueStatus.RETRYING] },
      nextAttemptAt: { lte: new Date() },
    },
    select: {
      userId: true,
      notification: {
        select: {
          sequence: true,
        },
      },
    },
    take: limit * 3,
  });

  const usersByPriority = Array.from(
    dueEntries.reduce(
      (map, entry) =>
        map.set(
          entry.userId,
          Math.min(map.get(entry.userId) ?? Number.MAX_SAFE_INTEGER, entry.notification.sequence)
        ),
      new Map<string, number>()
    )
  )
    .sort((left, right) => left[1] - right[1])
    .map(([userId]) => userId);

  const summary = {
    usersLocked: 0,
    processed: 0,
    sent: 0,
    retried: 0,
    failed: 0,
  };

  for (const userId of usersByPriority) {
    if (summary.processed >= limit) break;

    const locked = await tryAcquireUserLock(userId);
    if (!locked) continue;

    summary.usersLocked += 1;

    try {
      const result = await processUserQueue(userId, limit - summary.processed);
      summary.processed += result.processed;
      summary.sent += result.sent;
      summary.retried += result.retried;
      summary.failed += result.failed;
    } finally {
      await releaseUserLock(userId);
    }
  }

  return summary;
}

export async function enqueuePaymentReminderNotifications() {
  const now = new Date();
  const thirtyMinutes = REMINDER_INTERVAL_MINUTES * 60_000;

  const admins = await getAdminRecipients();
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT_CONFIRMATION",
      paymentProofUrl: null,
    },
    select: {
      id: true,
      trackingToken: true,
      customerName: true,
      createdAt: true,
      total: true,
    },
  });

  let enqueued = 0;

  for (const order of pendingOrders) {
    const elapsed = now.getTime() - order.createdAt.getTime();
    const bucket = Math.floor(elapsed / thirtyMinutes);

    if (bucket < 1) continue;

    for (const admin of admins) {
      const reminderKey = `order:${order.id}:admin:${admin.id}:reminder:${bucket}`;
      await queueNotification({
        userId: admin.id,
        type: "PAYMENT_REMINDER",
        title: "Pedido pendiente por validar",
        body: `${order.customerName} sigue esperando validación del pago`,
        orderId: order.id,
        dedupeKey: reminderKey,
        payload: {
          url: "/dashboard/todos-pedidos",
          data: {
            trackingToken: order.trackingToken,
            customerName: order.customerName,
            total: String(order.total),
            reminderBucket: String(bucket),
          },
        },
        availableAt: new Date(order.createdAt.getTime() + bucket * thirtyMinutes),
      });
      enqueued += 1;
    }
  }

  return { enqueued };
}
