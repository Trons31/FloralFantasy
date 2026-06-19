import { prisma } from "@/lib/prisma";
import FloresManager from "@/components/admin/FloresManager";

export const dynamic = "force-dynamic";

export default async function FloresPage() {
  const flowers = await prisma.flower.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      imageUrl: true,
      createdAt: true,
    },
  }).catch(() => []);

  return (
    <FloresManager
      flowers={flowers.map(flower => ({
        ...flower,
        createdAt: flower.createdAt.toISOString(),
      }))}
    />
  );
}