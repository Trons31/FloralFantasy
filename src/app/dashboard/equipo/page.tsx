import { prisma } from "@/lib/prisma";
import EquipoManager from "@/components/admin/EquipoManager";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const [team, lastAccessSetting] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["PREPARADOR", "REPARTIDOR", "CORREDOR"] } },
      select: { id: true, name: true, email: true, role: true, pin: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.appSetting.findUnique({ where: { key: "operationsLastAccess" } }).catch(() => null),
  ]);

  const lastAccess = (() => {
    if (!lastAccessSetting?.value) return null;
    try {
      const parsed = JSON.parse(lastAccessSetting.value);
      return typeof parsed?.at === "string" && typeof parsed?.name === "string"
        ? { at: parsed.at, id: typeof parsed.id === "string" ? parsed.id : undefined, name: parsed.name, role: String(parsed.role || "") }
        : null;
    } catch {
      return null;
    }
  })();

  return (
    <EquipoManager
      members={team.map(member => ({ ...member, createdAt: member.createdAt.toISOString() }))}
      lastAccess={lastAccess}
    />
  );
}
