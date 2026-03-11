import { prisma } from "@/lib/prisma";
import ContabilidadClient from "@/components/admin/ContabilidadClient";

export default async function ContabilidadPage() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({ where: { status: { in: ["PAID","PROCESSING","READY","OUT_FOR_DELIVERY","DELIVERED"] }, createdAt: { gte: startOfMonth } }, select: { total: true, createdAt: true } }).catch(() => []),
    prisma.expense.findMany({ where: { date: { gte: startOfMonth } }, orderBy: { date: "desc" } }).catch(() => []),
  ]);
  const totalIncome   = orders.reduce((s,o) => s + o.total, 0);
  const totalExpenses = expenses.reduce((s,e) => s + e.amount, 0);
  const serialized    = expenses.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() }));
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contabilidad</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen del mes actual</p>
      </div>
      <ContabilidadClient totalIncome={totalIncome} totalExpenses={totalExpenses} profit={totalIncome - totalExpenses} expenses={serialized} />
    </div>
  );
}
