import { NextRequest } from "next/server";

export function isAuthorizedCronRequest(req: NextRequest) {
  const expected = process.env.CRON_JOB_SECRET || process.env.CRON_SECRET || "";
  if (!expected) return true;

  const provided =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  return provided === expected;
}
