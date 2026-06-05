import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import CartDrawer from "@/components/client/CartDrawer";
import ProductDetail from "@/components/client/ProductDetail";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" } }, category: true, flowers: { include: { flower: true } } },
  }).catch(() => null);
  if (!product) notFound();
  const addons = await prisma.addOn.findMany({ where: { inStock: true } }).catch(() => []);
  const serialized = { ...product, createdAt: product.createdAt.toISOString() };
  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header />
      <ProductDetail product={serialized} addons={addons} />
      <Footer />
      <CartDrawer />
    </main>
  );
}
