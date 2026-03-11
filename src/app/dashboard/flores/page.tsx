import { prisma } from "@/lib/prisma";
import FloresManager from "@/components/admin/FloresManager";

export default async function FloresPage() {
  const flowers = await prisma.flower.findMany({ orderBy: { name: "asc" } }).catch(() => []);
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Flores</h1>
        <p className="text-gray-500 text-sm mt-1">Registra todas las flores disponibles para tus arreglos</p>
      </div>
      <FloresManager flowers={flowers} />
    </div>
  );
}
