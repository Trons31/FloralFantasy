import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import AjustesClient from "@/components/admin/AjustesClient";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const session = await getServerSession(authOptions);
  const [deliveryFeeSetting, methods] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "deliveryFee" } }).catch(() => null),
    prisma.paymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }).catch(() => []),
  ]);

  return (
    <AjustesClient
      initialMethods={methods}
      initialDeliveryFee={Number(deliveryFeeSetting?.value || 8000)}
      initialLoginEmail={session?.user?.email || ""}
    />
  );
}
