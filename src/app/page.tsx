import { prisma } from "@/lib/prisma";
import Header from "@/components/client/Header";
import HeroSection from "@/components/client/HeroSection";
import FeaturedProducts from "@/components/client/FeaturedProducts";
import OccasionsSection from "@/components/client/OccasionsSection";
import TestimonialsSection from "@/components/client/TestimonialsSection";
import Footer from "@/components/client/Footer";
import CartDrawer from "@/components/client/CartDrawer";

export default async function HomePage() {
  // Primero intenta productos destacados
  let featured = await prisma.product.findMany({
    where: { featured: true, inStock: true },
    include: { images: { orderBy: { order: "asc" } }, category: true, flowers: { include: { flower: true } } },
    take: 8,
  }).catch(() => []);

  // Si no hay destacados, trae todos los disponibles
  if (featured.length === 0) {
    featured = await prisma.product.findMany({
      where: { inStock: true },
      include: { images: { orderBy: { order: "asc" } }, category: true, flowers: { include: { flower: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }).catch(() => []);
  }

  const serialized = featured.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }));

  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header />
      <HeroSection />
      <FeaturedProducts products={serialized} />
      <OccasionsSection />
      <TestimonialsSection />
      <Footer />
      <CartDrawer />
    </main>
  );
}