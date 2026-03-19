import { prisma } from "@/lib/prisma";
import EquipoManager from "@/components/admin/EquipoManager";

export default async function EquipoPage() {
  const team = await prisma.user.findMany({
    where: { role: { in: ["PREPARADOR", "REPARTIDOR"] } },
    select: { id: true, name: true, email: true, role: true, pin: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona preparadores y repartidores — acceden con PIN en{" "}
          <strong className="text-primary-600">/operaciones</strong>
        </p>
      </div>
      <EquipoManager members={team} />
    </div>
  );
}