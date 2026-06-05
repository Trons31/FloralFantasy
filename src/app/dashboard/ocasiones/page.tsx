import { prisma } from "@/lib/prisma";
import OcasionesManager from "@/components/admin/OcasionesManager";

export const dynamic = "force-dynamic";

export default async function OcasionesPage() {
  const occasions = await prisma.occasion.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      subtitle: true,
      advanceOrderDays: true,
      sortOrder: true,
      isActive: true,
      images: {
        select: { id: true, url: true, publicId: true, isMain: true, order: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  }).catch(() => []);

  return (
    <div className="p-6 lg:p-8">
      <OcasionesManager occasions={occasions} />
    </div>
  );
}
