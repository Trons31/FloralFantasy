import { prisma } from "@/lib/prisma";
import ProductosManager from "@/components/admin/ProductosManager";

export default async function ProductosPage() {
  const [products, categories, flowers] = await Promise.all([
    prisma.product.findMany({ include: { images: { orderBy: { order: "asc" } }, category: true, flowers: { include: { flower: true } } }, orderBy: { createdAt: "desc" } }).catch(() => []),
    prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.flower.findMany({ orderBy: { name: "asc" } }).catch(() => []),
  ]);
  const serialized = products.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }));
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <p className="text-gray-500 text-sm mt-1">Ramos, arreglos y composiciones florales</p>
      </div>
      <ProductosManager products={serialized} categories={categories} flowers={flowers} />
    </div>
  );
}
