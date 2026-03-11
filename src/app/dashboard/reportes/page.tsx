import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { RiBarChartLine, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";

export default async function ReportesPage() {
  const now = new Date();
  const periods = [
    { label: "Hoy",   start: new Date(now.getFullYear(),now.getMonth(),now.getDate()) },
    { label: "Semana",start: new Date(now.getTime() - 7*24*60*60*1000) },
    { label: "Mes",   start: new Date(now.getFullYear(),now.getMonth(),1) },
  ];

  const data = await Promise.all(periods.map(async p => {
    const [income, expenses, count] = await Promise.all([
      prisma.order.aggregate({ where: { status: { in: ["PAID","PROCESSING","READY","OUT_FOR_DELIVERY","DELIVERED"] }, createdAt: { gte: p.start } }, _sum: { total: true } }).catch(() => ({_sum:{total:0}})),
      prisma.expense.aggregate({ where: { date: { gte: p.start } }, _sum: { amount: true } }).catch(() => ({_sum:{amount:0}})),
      prisma.order.count({ where: { createdAt: { gte: p.start }, status: { not: "CANCELLED" } } }).catch(() => 0),
    ]);
    return { label: p.label, income: income._sum.total||0, expenses: expenses._sum.amount||0, count };
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen financiero por período</p>
      </div>

      <div className="grid gap-6">
        {data.map(d => (
          <div key={d.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <RiBarChartLine className="text-primary-500"/>
              <h2 className="font-semibold text-gray-900">{d.label}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-50">
              {[
                { label:"Pedidos",   value: String(d.count),         sub:"órdenes",     color:"text-gray-900" },
                { label:"Ingresos",  value: formatPrice(d.income),   sub:"ventas",      color:"text-green-600" },
                { label:"Egresos",   value: formatPrice(d.expenses), sub:"gastos",      color:"text-red-500" },
                { label:"Ganancia",  value: formatPrice(d.income - d.expenses), sub:"neta", color: (d.income-d.expenses)>=0?"text-primary-600":"text-red-600" },
              ].map(s => (
                <div key={s.label} className="p-5">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
