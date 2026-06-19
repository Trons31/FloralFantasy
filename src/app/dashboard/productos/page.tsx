import { prisma } from "@/lib/prisma";
import ProductosManager from "@/components/admin/ProductosManager";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const [products, categories, flowers, occasions, sales] = await Promise.all([
    prisma.product.findMany({
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        flowers: { include: { flower: true } },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.flower.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.occasion.findMany({
      select: { id: true, name: true, slug: true, subtitle: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }).catch(() => []),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
    }).catch(() => []),
  ]);

  const salesMap = new Map(sales.map(item => [item.productId, item._sum.quantity || 0]));

  return (
    <ProductosManager
      products={products.map(product => ({
        ...product,
        createdAt: product.createdAt.toISOString(),
        sales: salesMap.get(product.id) || 0,
      }))}
      categories={categories}
      flowers={flowers}
      occasions={occasions}
    />
  );
}