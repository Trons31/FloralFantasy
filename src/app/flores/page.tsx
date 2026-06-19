import { prisma } from "@/lib/prisma";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import CartDrawer from "@/components/client/CartDrawer";
import FloresClient from "@/components/client/FloresClient";

export const dynamic = "force-dynamic";

export default async function FloresPage({
  searchParams,
}: {
  searchParams: { categoria?: string; ocasion?: string; q?: string; flor?: string };
}) {
  const [products, categories, flowers, occasions] = await Promise.all([
    prisma.product.findMany({
      where: { inStock: true },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        flowers: { include: { flower: true } },
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
      <FloresClient
        products={serialized}
        categories={categories}
        flowerTypes={flowerTypes}
        occasions={occasions}
        initialFilters={searchParams}
      />
      <Footer />
      <CartDrawer />
    </main>
  );
}
