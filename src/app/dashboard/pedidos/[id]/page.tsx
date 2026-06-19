import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderDetailEditor from "@/components/admin/OrderDetailEditor";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      paymentMethod: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      items: {
        include: {
          product: { include: { images: true, flowers: { include: { flower: true } } } },
          addons: { include: { addon: true } },
        },
      },
    },
  }).catch(() => null);

  if (!order) notFound();

  const serialized = JSON.parse(JSON.stringify(order));
  return <OrderDetailEditor initialOrder={serialized} />;
}
