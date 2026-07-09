import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import AjustesClient from "@/components/admin/AjustesClient";
import { authOptions } from "@/lib/auth";
import { DEFAULT_SAME_DAY_CUTOFF_TIME, normalizeSameDayCutoffTime } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const session = await getServerSession(authOptions);
  const [deliveryFeeSetting, cutoffSetting, methods] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "deliveryFee" } }).catch(() => null),
    prisma.appSetting.findUnique({ where: { key: "sameDayCutoffTime" } }).catch(() => null),
    prisma.paymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }).catch(() => []),
  ]);

  return (
    <AjustesClient
      initialMethods={methods}
      initialDeliveryFee={Number(deliveryFeeSetting?.value || 8000)}
      initialSameDayCutoffTime={normalizeSameDayCutoffTime(cutoffSetting?.value || DEFAULT_SAME_DAY_CUTOFF_TIME)}
      initialLoginEmail={session?.user?.email || ""}
    />
  );
}
