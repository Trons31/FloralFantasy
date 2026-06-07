import ContabilidadDashboard from "./ContabilidadDashboard";
import { getAccountingSummary } from "@/lib/accounting";

export const dynamic = "force-dynamic";

export default async function ContabilidadPage() {
  const now = new Date();
  const initial = await getAccountingSummary({
    mode: "month",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  return <ContabilidadDashboard initialData={initial} />;
}
