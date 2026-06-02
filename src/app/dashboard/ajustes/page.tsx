import { prisma } from "@/lib/prisma";
import AjustesClient from "@/components/admin/AjustesClient";

export default async function AjustesPage() {
  const deliveryFeeSetting = await prisma.appSetting.findUnique({ where: { key: "deliveryFee" } }).catch(() => null);
  const methods = await prisma.paymentMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  }).catch(() => []);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-500 text-sm mt-1">Métodos de pago y configuración activa del checkout</p>
      </div>
      <AjustesClient
        initialMethods={methods.map(m => ({ ...m }))}
        initialDeliveryFee={Number(deliveryFeeSetting?.value || 8000)}
      />
    </div>
  );
}
