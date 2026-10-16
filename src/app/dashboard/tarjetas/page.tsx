import { prisma } from "@/lib/prisma";
import CardOptionsManager from "@/components/admin/CardOptionsManager";
import { cardOptionSelect } from "@/lib/card-options";

export const dynamic = "force-dynamic";

export default async function TarjetasPage() {
  const options = await prisma.cardOption.findMany({
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    select: { ...cardOptionSelect, _count: { select: { orderItems: true } } },
  }).catch(() => []);

  return (
    <CardOptionsManager
      initialOptions={options.map(({ _count, ...option }) => ({ ...option, sales: _count.orderItems }))}
    />
  );
}
