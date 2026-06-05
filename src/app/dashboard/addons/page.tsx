import { prisma } from "@/lib/prisma";
import AddonsManager from "@/components/admin/AddonsManager";

export const dynamic = "force-dynamic";

export default async function AddonsPage() {
  const addons = await prisma.addOn.findMany({ orderBy: { type: "asc" } }).catch(() => []);
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos adicionales</h1>
        <p className="text-gray-500 text-sm mt-1">Bebidas, vinos, peluches, dulces y canastas</p>
      </div>
      <AddonsManager addons={addons} />
    </div>
  );
}
