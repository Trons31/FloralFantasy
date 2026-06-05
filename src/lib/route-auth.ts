import crypto from "crypto";
import { getServerSession } from "next-auth";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export const OPERATION_ROLES = ["PREPARADOR", "REPARTIDOR", "CORREDOR"] as const;
export const OPERATIONS_SESSION_COOKIE = "ff_ops_session";
export const OPERATIONS_SESSION_TTL_SECONDS = 60 * 60 * 8;

type AdminRole = (typeof ADMIN_ROLES)[number];
type OperationRole = (typeof OPERATION_ROLES)[number];

type RouteUser = {
  id: string;
  name: string;
  email?: string | null;
  role: string;
};

type SignedOperationsSession = {
  id: string;
  name: string;
  role: OperationRole;
  exp: number;
};

function getSessionSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.OPERATIONS_SESSION_SECRET || "";
}

function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && (ADMIN_ROLES as readonly string[]).includes(role);
}

function isOperationRole(role: unknown): role is OperationRole {
  return typeof role === "string" && (OPERATION_ROLES as readonly string[]).includes(role);
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function sign(value: string) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required to validate operations sessions");
  }
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeSession(session: SignedOperationsSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): SignedOperationsSession | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedOperationsSession;
    if (!parsed || !parsed.id || !parsed.name || !parsed.role || !parsed.exp) return null;
    if (!isOperationRole(parsed.role)) return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createOperationsSessionToken(user: RouteUser) {
  if (!isOperationRole(user.role)) {
    throw new Error("Only operations roles can receive an operations session");
  }

  return encodeSession({
    id: user.id,
    name: user.name,
    role: user.role,
    exp: Date.now() + OPERATIONS_SESSION_TTL_SECONDS * 1000,
  });
}

export function operationsSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OPERATIONS_SESSION_TTL_SECONDS,
  };
}

export function clearOperationsSessionCookie(response: NextResponse) {
  response.cookies.set(OPERATIONS_SESSION_COOKIE, "", {
    ...operationsSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}

async function getOperationsUser(req: NextRequest): Promise<RouteUser | null> {
  const raw = req.cookies.get(OPERATIONS_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const payload = decodeSession(raw);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true },
  }).catch(() => null);

  if (!user || !isOperationRole(user.role) || user.role !== payload.role) {
    return null;
  }

  return user;
}

export async function getAdminUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const role = user?.role;
  if (!isAdminRole(role)) return null;

  return {
    id: user?.email || user?.name || "admin",
    name: user?.name || "",
    email: user?.email || null,
    role,
  };
}

export async function getPrivilegedUser(req: NextRequest) {
  const admin = await getAdminUser();
  if (admin?.id) return { kind: "admin" as const, user: admin };

  const operations = await getOperationsUser(req);
  if (operations) return { kind: "operations" as const, user: operations };

  return null;
}

export async function requireAdminUser() {
  return getAdminUser();
}

export async function requireOrderManagementUser(req: NextRequest) {
  return getPrivilegedUser(req);
}
