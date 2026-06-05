import { prisma } from "@/lib/prisma";
import Header from "@/components/client/Header";
import HeroSection from "@/components/client/HeroSection";
import FeaturedProducts from "@/components/client/FeaturedProducts";
import OccasionsSection from "@/components/client/OccasionsSection";
import TestimonialsSection from "@/components/client/TestimonialsSection";
import Footer from "@/components/client/Footer";
import CartDrawer from "@/components/client/CartDrawer";
import WhatsAppButton from "@/components/client/WhatsAppButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [occasionsRaw, featuredRaw] = await Promise.all([
    prisma.occasion.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subtitle: true,
        advanceOrderDays: true,
        images: {
          select: { url: true, isMain: true, order: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }).catch(() => []),
    prisma.product.findMany({
      where: { featured: true, inStock: true },
      include: { images: { orderBy: { order: "asc" } }, category: true, flowers: { include: { flower: true } } },
      take: 8,
    }).catch(() => []),
  ]);

  let featured = featuredRaw;
  if (featured.length === 0) {
    featured = await prisma.product.findMany({
      where: { inStock: true },
      include: { images: { orderBy: { order: "asc" } }, category: true, flowers: { include: { flower: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }).catch(() => []);
  }

  const serialized = featured.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));
  const occasions = occasionsRaw;

  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header />
      <HeroSection />
      <FeaturedProducts products={serialized} />
      <OccasionsSection occasions={occasions} />
      <TestimonialsSection />
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </main>
  );
}
