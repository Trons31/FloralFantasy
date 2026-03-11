import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/admin/KanbanBoard";

export default async function PedidosPage() {
  const orders = await prisma.order.findMany({
    where: { status: { notIn: ["DELIVERED","CANCELLED"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);
  const serialized = orders.map(o => ({ ...o, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString() }));
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tablero de pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">Arrastra para cambiar estado — se notifica al cliente automáticamente</p>
      </div>
      <KanbanBoard initialOrders={serialized} />
    </div>
  );
}
