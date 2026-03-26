// app/admin/pedidos/page.tsx
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/admin/KanbanBoard";

export default async function PedidosPage() {
  const orders = await prisma.order
    .findMany({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
      include: {
        items: {
          include: {
            product: { include: { images: true } },
            addons: { include: { addon: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const serialized = orders.map(o => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* KanbanBoard incluye el header y el modal internamente */}
      <KanbanBoard initialOrders={serialized} />
    </div>
  );
}