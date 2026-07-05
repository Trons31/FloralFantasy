import { NextRequest, NextResponse } from "next/server";
import { getPrivilegedUser } from "@/lib/route-auth";
import { registerPushToken } from "@/lib/push-tokens";

export async function POST(req: NextRequest) {
  const access = await getPrivilegedUser(req);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!access.user.id) {
    return NextResponse.json({ error: "Usuario sin id válido para notificaciones" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => null);
    await registerPushToken(access.user.id, body);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[push-tokens] No se pudo registrar la suscripción", {
      userId: access.user.id,
      role: access.user.role,
      message: error?.message,
      code: error?.code,
    });

    return NextResponse.json({ error: error?.message || "Suscripción push inválida" }, { status: 400 });
  }
}
