import { prisma } from "@/lib/prisma";

export async function registerPushToken(userId: string, payload: unknown) {
  const body = payload as Record<string, unknown> | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body?.p256dh === "string"
    ? body.p256dh
    : typeof body?.keys === "object" && body?.keys && typeof (body.keys as Record<string, unknown>).p256dh === "string"
      ? ((body.keys as Record<string, unknown>).p256dh as string)
      : "";
  const auth = typeof body?.auth === "string"
    ? body.auth
    : typeof body?.keys === "object" && body?.keys && typeof (body.keys as Record<string, unknown>).auth === "string"
      ? ((body.keys as Record<string, unknown>).auth as string)
      : "";

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Suscripcion push invalida");
  }

  await prisma.pushToken.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId, p256dh, auth },
  });

  return { ok: true };
}
