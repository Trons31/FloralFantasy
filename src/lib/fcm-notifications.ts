import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFirebaseMessaging } from "@/lib/firebase-admin";
import type { PushPayload } from "@/lib/push-notifications";
import type { TransportDispatchResult } from "@/lib/notifications/types";

function serializeData(payload: PushPayload) {
  const data: Record<string, string> = {};

  data.title = payload.title;
  data.body = payload.body;
  if (payload.url) data.url = payload.url;
  if (payload.icon) data.icon = payload.icon;

  for (const [key, value] of Object.entries(payload.data ?? {})) {
    data[key] = String(value ?? "");
  }

  return data;
}

export async function sendFcmToUser(userId: string, payload: PushPayload): Promise<TransportDispatchResult> {
  const tokens = await prisma.fCMToken.findMany({ where: { userId } });

  if (tokens.length === 0) {
    return {
      channel: NotificationChannel.FCM,
      attempted: false,
      success: false,
      permanentFailure: true,
      error: "Sin tokens FCM registrados",
    };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return {
      channel: NotificationChannel.FCM,
      attempted: true,
      success: false,
      permanentFailure: true,
      error: "Firebase Admin no configurado",
    };
  }

  const invalidTokens = new Set<string>();
  let successCount = 0;
  const errors: string[] = [];

  for (let index = 0; index < tokens.length; index += 500) {
    const batch = tokens.slice(index, index + 500);
    const response = await messaging.sendEachForMulticast({
      tokens: batch.map((token) => token.token),
      data: serializeData(payload),
      webpush: {
        fcmOptions: {
          link: payload.url || "/operaciones",
        },
      },
    });

    successCount += response.successCount;

    response.responses.forEach((item, responseIndex) => {
      if (item.success) return;

      const token = batch[responseIndex]?.token;
      const code = item.error?.code || "";
      const message = item.error?.message || "Error FCM";
      errors.push(message);

      if (
        token &&
        (code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument")
      ) {
        invalidTokens.add(token);
      }
    });
  }

  if (invalidTokens.size > 0) {
    await prisma.fCMToken.deleteMany({ where: { token: { in: Array.from(invalidTokens) } } });
  }

  return {
    channel: NotificationChannel.FCM,
    attempted: true,
    success: successCount > 0,
    permanentFailure: successCount === 0 && invalidTokens.size === tokens.length,
    providerMessageId: successCount > 0 ? `fcm:${successCount}` : undefined,
    error: successCount > 0 ? undefined : errors.join("; ") || "No se pudo enviar por FCM",
  };
}
