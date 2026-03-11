import { prisma } from "@/lib/prisma";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import CartDrawer from "@/components/client/CartDrawer";
import FloresClient from "@/components/client/FloresClient";

export default async function FloresPage({ searchParams }: { searchParams: { categoria?: string; ocasion?: string; q?: string; flor?: string } }) {
  const [products, categories, flowers] = await Promise.all([
    prisma.product.findMany({
      where: {
        inStock: true,
        ...(searchParams.categoria ? { category: { slug: searchParams.categoria } } : {}),
        ...(searchParams.ocasion   ? { occasion: searchParams.ocasion } : {}),
        ...(searchParams.q         ? { name: { contains: searchParams.q, mode: "insensitive" } } : {}),
        ...(searchParams.flor      ? { flowers: { some: { flower: { type: searchParams.flor } } } } : {}),
      },
      include: { images: { orderBy: { order: "asc" } }, category: true, flowers: { include: { flower: true } } },
      orderBy: { featured: "desc" },
    }).catch(() => []),
    prisma.category.findMany().catch(() => []),
    prisma.flower.findMany({ select: { type: true } }).catch(() => []),
  ]);
  const flowerTypes = [...new Set(flowers.map(f => f.type))];
  const serialized  = products.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }));
  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header />
      <FloresClient products={serialized} categories={categories} flowerTypes={flowerTypes} />
      <Footer />
      <CartDrawer />
    </main>
  );
}
