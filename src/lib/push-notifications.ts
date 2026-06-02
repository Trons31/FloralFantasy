import webpush from "web-push";
import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TransportDispatchResult } from "@/lib/notifications/types";

const vapidSubject = process.env.VAPID_SUBJECT || process.env.VAPID_MAILTO || "mailto:admin@example.com";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

const pushConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (pushConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, unknown>;
}

function serializePayload(payload: PushPayload) {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/flowers/logo.png",
    url: payload.url || "/dashboard/todos-pedidos",
    data: payload.data ?? {},
  });
}

export async function sendWebPushToUser(userId: string, payload: PushPayload): Promise<TransportDispatchResult> {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });

  if (tokens.length === 0) {
    return {
      channel: NotificationChannel.WEB_PUSH,
      attempted: false,
      success: false,
      permanentFailure: true,
      error: "Sin suscripciones Web Push registradas",
    };
  }

  if (!pushConfigured) {
    return {
      channel: NotificationChannel.WEB_PUSH,
      attempted: true,
      success: false,
      permanentFailure: true,
      error: "Web Push no configurado",
    };
  }

  const results = await Promise.allSettled(
    tokens.map((token) =>
      webpush.sendNotification(
        { endpoint: token.endpoint, keys: { p256dh: token.p256dh, auth: token.auth } },
        serializePayload(payload)
      )
    )
  );

  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");
  const expiredEndpoints = results
    .map((result, index) => {
      if (result.status !== "rejected") return null;
      const error = result.reason as { statusCode?: number } | undefined;
      return error?.statusCode === 404 || error?.statusCode === 410 ? tokens[index]?.endpoint : null;
    })
    .filter(Boolean) as string[];

  if (expiredEndpoints.length > 0) {
    await prisma.pushToken.deleteMany({ where: { endpoint: { in: expiredEndpoints } } });
  }

  return {
    channel: NotificationChannel.WEB_PUSH,
    attempted: true,
    success: fulfilled.length > 0,
    permanentFailure: fulfilled.length === 0 && expiredEndpoints.length === tokens.length,
    error:
      fulfilled.length > 0
        ? undefined
        : rejected
            .map((result) => String(result.reason?.message ?? result.reason ?? "Error Web Push"))
            .join("; "),
  };
}
