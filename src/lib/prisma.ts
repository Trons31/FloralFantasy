import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function readEnvFileDatabaseUrl() {
  const candidates = [".env.local", ".env.development.local", ".env.development", ".env"];

  for (const filename of candidates) {
    try {
      const envPath = path.join(process.cwd(), filename);
      if (!fs.existsSync(envPath)) continue;

      const content = fs.readFileSync(envPath, "utf8");
      const line = content
        .split(/\r?\n/)
        .find(entry => entry.trim().startsWith("DATABASE_URL="));

      if (!line) continue;

      const raw = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
      if (raw.startsWith("postgresql://") || raw.startsWith("postgres://")) {
        return raw;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function resolveDatabaseUrl() {
  const fileUrl = readEnvFileDatabaseUrl();
  const envUrl = process.env.DATABASE_URL?.trim();

  if (fileUrl) {
    process.env.DATABASE_URL = fileUrl;
    return fileUrl;
  }

  if (envUrl && (envUrl.startsWith("postgresql://") || envUrl.startsWith("postgres://"))) {
    return envUrl;
  }

  return envUrl || "";
}

const g = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  g.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
