import { NextRequest, NextResponse } from "next/server";
import { getPrivilegedUser } from "@/lib/route-auth";
import { registerPushToken } from "@/lib/push-tokens";

export async function POST(req: NextRequest) {
  const access = await getPrivilegedUser(req);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    await registerPushToken(access.user.id, body);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Suscripcion push invalida" }, { status: 400 });
  }
}
