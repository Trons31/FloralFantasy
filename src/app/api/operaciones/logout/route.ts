import { NextResponse } from "next/server";
import { clearOperationsSessionCookie } from "@/lib/route-auth";

export async function POST() {
  return clearOperationsSessionCookie(NextResponse.json({ ok: true }));
}

export async function GET() {
  return clearOperationsSessionCookie(NextResponse.json({ ok: true }));
}
