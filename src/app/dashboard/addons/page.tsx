import { prisma } from "@/lib/prisma";
import AddonsManager from "@/components/admin/AddonsManager";

export const dynamic = "force-dynamic";

export default async function AddonsPage() {
  const addons = await prisma.addOn.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: { _count: { select: { orderItems: true } } },
  }).catch(() => []);

  return <AddonsManager initialAddons={addons.map(addon => ({ ...addon, sales: addon._count.orderItems }))} />;
}
