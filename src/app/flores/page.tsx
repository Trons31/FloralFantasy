import { prisma } from "@/lib/prisma";
import { productFlowerInclude } from "@/lib/product-selects";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import FloresClient from "@/components/client/FloresClient";

export const dynamic = "force-dynamic";

export default async function FloresPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; ocasion?: string; q?: string; flor?: string }>;
}) {
  const filters = await searchParams;
  const [products, categories, flowers, occasions] = await Promise.all([
    prisma.product.findMany({
      where: { inStock: true },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        flowers: productFlowerInclude,
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }).catch(() => []),
    prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.flower.findMany({ select: { type: true } }).catch(() => []),
    prisma.occasion.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }).catch(() => []),
  ]);

  const flowerTypes = Array.from(new Set(flowers.map(flower => flower.type)));
  const serialized = products.map(product => ({
    ...product,
    createdAt: product.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-[#fffdfa]">
      <Header forceLight />
      {/* `key`: al ir de /flores?ocasion=amor a ?ocasion=bodas desde la cabecera,
          el cliente se remonta y toma los filtros nuevos. */}
      <FloresClient
        key={JSON.stringify(filters)}
        products={serialized}
        categories={categories}
        flowerTypes={flowerTypes}
        occasions={occasions}
        initialFilters={filters}
      />
      <Footer />
    </main>
  );
}
