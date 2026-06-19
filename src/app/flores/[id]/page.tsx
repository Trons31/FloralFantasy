import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import CartDrawer from "@/components/client/CartDrawer";
import ProductDetail from "@/components/client/ProductDetail";

export const dynamic = "force-dynamic";

function parseCookieArray(value?: string) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
  } catch {
    return [] as string[];
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { order: "asc" } },
      category: true,
      flowers: { include: { flower: true } },
    },
  }).catch(() => null);
  if (!product) notFound();

  const cookieStore = cookies();
  const viewedIds = parseCookieArray(cookieStore.get("ff_viewed_products")?.value);
  const searchTerms = parseCookieArray(cookieStore.get("ff_catalog_searches")?.value)
    .map(term => term.trim().toLocaleLowerCase("es"))
    .filter(Boolean);

  const [addons, candidates] = await Promise.all([
    prisma.addOn.findMany({ where: { inStock: true } }).catch(() => []),
    prisma.product.findMany({
      where: { id: { not: product.id }, inStock: true },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        flowers: { include: { flower: true } },
      },
      take: 40,
    }).catch(() => []),
  ]);

  const currentFlowerTypes = new Set(product.flowers.map(item => item.flower.type));
  const viewedRank = new Map(viewedIds.map((id, index) => [id, viewedIds.length - index]));
  const scored = candidates.map(candidate => {
    const searchable = `${candidate.name} ${candidate.description} ${candidate.category.name} ${candidate.flowers.map(item => `${item.flower.name} ${item.flower.type}`).join(" ")}`.toLocaleLowerCase("es");
    let score = Math.random();
    if (candidate.categoryId === product.categoryId) score += 6;
    if (candidate.occasion && candidate.occasion === product.occasion) score += 4;
    if (candidate.flowers.some(item => currentFlowerTypes.has(item.flower.type))) score += 4;
    if (searchTerms.some(term => searchable.includes(term))) score += 8;
    if (viewedRank.has(candidate.id)) score += 2 + (viewedRank.get(candidate.id) || 0) / 10;
    if (candidate.featured) score += 1;
    return { candidate, score };
  }).sort((a, b) => b.score - a.score);

  const recommendations = scored.slice(0, 4).map(({ candidate }) => ({
    ...candidate,
    createdAt: candidate.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-[#fffdfb]">
      <Header forceLight />
      <ProductDetail
        product={{ ...product, createdAt: product.createdAt.toISOString() }}
        addons={addons}
        recommendations={recommendations}
      />
      <Footer />
      <CartDrawer />
    </main>
  );
}