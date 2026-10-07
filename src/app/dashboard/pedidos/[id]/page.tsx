import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productFlowerInclude } from "@/lib/product-selects";
import OrderDetailEditor from "@/components/admin/OrderDetailEditor";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      paymentMethod: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      items: {
        include: {
          product: { include: { images: true, flowers: productFlowerInclude } },
          addons: { include: { addon: true } },
        },
      },
    },
  }).catch(() => null);

  if (!order) notFound();

  const serialized = JSON.parse(JSON.stringify(order));
  return <OrderDetailEditor initialOrder={serialized} />;
}
