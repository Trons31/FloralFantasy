"use client";
import Link from "next/link";
import {
  RiArrowUpLine, RiArrowDownLine, RiMoneyDollarCircleLine, RiShoppingBagLine,
  RiBarChartLine, RiArrowRightLine, RiAlertLine, RiCheckLine, RiTrophyLine,
  RiPieChartLine, RiFlowerLine, RiExternalLinkLine,
} from "react-icons/ri";
import { formatPrice } from "@/lib/utils";

function pct(curr: number, prev: number) {
  if (!prev) return null;
  const d = ((curr - prev) / prev) * 100;
  return { value: Math.abs(d).toFixed(1), up: d >= 0 };
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${w}%` }} />
    </div>
  );
}

function WeekBarChart({ data }: { data: { date: string; revenue: number }[] }) {
  const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i);
    const iso = d.toISOString().slice(0, 10);
    const found = data.find(x => x.date === iso);
    return {
      date: iso,
      day: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      revenue: found?.revenue ?? 0,
      isToday: iso === today.toISOString().slice(0, 10),
    };
  });

  const max = Math.max(...weekDays.map(d => d.revenue), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-24">
        {weekDays.map((d, i) => {
          const p = d.revenue / max;
          const h = d.revenue > 0 ? Math.max(p * 100, 8) : 0;
          const isTop = d.revenue === max && d.revenue > 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative h-full">
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d.revenue > 0 ? formatPrice(d.revenue) : "Sin ventas"}
              </div>
              {d.revenue > 0 ? (
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${isTop ? "bg-primary-500" : "bg-primary-200 group-hover:bg-primary-400"
                    }`}
                  style={{ height: `${h}%` }}
                />
              ) : (
                <div className="w-full h-0.5 bg-gray-100 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {weekDays.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className={`text-[10px] font-semibold ${d.isToday ? "text-primary-500" : "text-gray-400"}`}>
              {d.day}
            </span>
            <span className={`text-[9px] ${d.isToday ? "text-primary-400" : "text-gray-300"}`}>
              {d.dayNum}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CAT_COLORS: Record<string, string> = {
  Flores: "bg-pink-400",
  Transporte: "bg-blue-400",
  Decoración: "bg-purple-400",
  Empaque: "bg-amber-400",
  Personal: "bg-teal-400",
  Otro: "bg-gray-400",
};

export default function ContabilidadDashboard({
  current, previous, topProducts, expensesByCategory, dailyRevenue, deficitRecommendation,
}: {
  current: { income: number; expenses: number; profit: number; orderCount: number; avgTicket: number };
  previous: { income: number; expenses: number; profit: number; orderCount: number };
  topProducts: any[];
  expensesByCategory: { category: string; amount: number }[];
  dailyRevenue: { date: string; revenue: number }[];
  deficitRecommendation: number;
}) {
  const incomePct = pct(current.income, previous.income);
  const expPct = pct(current.expenses, previous.expenses);
  const profitPct = pct(current.profit, previous.profit);
  const ordersPct = pct(current.orderCount, previous.orderCount);
  const maxExpCat = Math.max(...expensesByCategory.map(e => e.amount), 1);
  const maxProduct = Math.max(...topProducts.map(p => p.revenue), 1);

  const isNegative = current.profit < 0;
  const profitMargin = current.income > 0
    ? (current.profit / current.income * 100).toFixed(1)
    : "0";

  // Mejor día de la semana actual
  const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i);
    return d.toISOString().slice(0, 10);
  });
  const weekData = dailyRevenue.filter(x => weekDates.includes(x.date));
  const bestDay = [...weekData].sort((a, b) => b.revenue - a.revenue)[0];
  const bestDayLabel = bestDay && bestDay.revenue > 0
    ? (() => {
      const d = new Date(bestDay.date + "T12:00:00");
      return `${DAY_NAMES[d.getDay()]} ${bestDay.date.slice(5)} — ${formatPrice(bestDay.revenue)}`;
    })()
    : "sin ventas esta semana";

  function Delta({ d }: { d: ReturnType<typeof pct> }) {
    if (!d) return null;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${d.up ? "text-green-600" : "text-red-500"}`}>
        {d.up ? <RiArrowUpLine size={11} /> : <RiArrowDownLine size={11} />}
        {d.value}%
      </span>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contabilidad</h1>
          <p className="text-gray-400 text-sm mt-1">Balance del mes actual vs mes anterior</p>
        </div>
        <Link href="/dashboard/egresos"
          className="flex w-fit items-center gap-2 border-2 border-primary-200 text-primary-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-colors">
          <RiArrowDownLine size={16} /> Gestionar egresos <RiExternalLinkLine size={13} />
        </Link>
      </div>

      {/* Alert */}
      {isNegative ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <RiAlertLine className="text-red-500" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-700">Mes en números rojos</p>
            <p className="text-red-600 text-sm mt-1">
              La pérdida este mes es <strong>{formatPrice(Math.abs(current.profit))}</strong>.
              {deficitRecommendation > 0 && (
                <> Para recuperar el balance necesitas vender aproximadamente{" "}
                  <strong>{deficitRecommendation} pedidos más</strong> con el ticket promedio
                  actual de {formatPrice(current.avgTicket)}.</>
              )}
            </p>
          </div>
        </div>
      ) : current.profit > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <RiCheckLine className="text-green-600" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-green-700">Mes rentable</p>
            <p className="text-green-600 text-sm mt-1">
              Margen de ganancia <strong>{profitMargin}%</strong>.{" "}
              {parseFloat(profitMargin) > 30
                ? "Excelente rendimiento este mes."
                : "Hay oportunidad de mejorar el margen reduciendo egresos."}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ingresos", value: current.income, delta: incomePct, icon: RiArrowUpLine, color: "text-green-600", bg: "bg-green-50" },
          { label: "Egresos", value: current.expenses, delta: expPct, icon: RiArrowDownLine, color: "text-red-500", bg: "bg-red-50" },
          { label: "Ganancia", value: current.profit, delta: profitPct, icon: RiMoneyDollarCircleLine, color: isNegative ? "text-red-600" : "text-primary-600", bg: isNegative ? "bg-red-50" : "bg-primary-50" },
          { label: "Pedidos", value: current.orderCount, delta: ordersPct, icon: RiShoppingBagLine, color: "text-gray-700", bg: "bg-gray-50", isCount: true },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon className={k.color} size={18} />
            </div>
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>
              {(k as any).isCount ? k.value : formatPrice(k.value)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <Delta d={k.delta} />
              <span className="text-xs text-gray-400">vs mes ant.</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico semanal + Métricas clave */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900 text-sm">Ventas esta semana</p>
            <RiBarChartLine className="text-gray-300" size={18} />
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Mejor día:{" "}
            <strong className="text-primary-600">{bestDayLabel}</strong>
          </p>
          <WeekBarChart data={dailyRevenue} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="font-semibold text-gray-900 text-sm">Métricas clave</p>
          {[
            { label: "Venta promedio", value: formatPrice(current.avgTicket), icon: RiShoppingBagLine, color: "text-blue-500" },
            { label: "Margen de ganancia", value: `${profitMargin}%`, icon: RiPieChartLine, color: parseFloat(profitMargin) > 20 ? "text-green-600" : "text-amber-500" },
            { label: "Pedidos del mes", value: String(current.orderCount), icon: RiTrophyLine, color: "text-primary-500" },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center ${m.color}`}>
                <m.icon size={15} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="font-bold text-gray-900 text-sm">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top productos + Egresos por categoría */}
      <div className="grid lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <RiFlowerLine className="text-primary-500" size={16} />
            <p className="font-semibold text-gray-900 text-sm">Productos más vendidos</p>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-6">Sin datos este mes</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-medium text-gray-800 truncate max-w-[160px]">
                        {p.product?.name || "Producto"}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-gray-900 text-xs">{formatPrice(p.revenue)}</p>
                      <p className="text-xs text-gray-400">{p.qty} uds.</p>
                    </div>
                  </div>
                  <MiniBar value={p.revenue} max={maxProduct} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RiPieChartLine className="text-red-400" size={16} />
              <p className="font-semibold text-gray-900 text-sm">Egresos por categoría</p>
            </div>
            <Link href="/dashboard/egresos" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Ver todos <RiArrowRightLine size={11} />
            </Link>
          </div>
          {expensesByCategory.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-6">Sin egresos este mes</p>
          ) : (
            <div className="space-y-3">
              {expensesByCategory.map(e => (
                <div key={e.category}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${CAT_COLORS[e.category] || "bg-gray-400"}`} />
                      <span className="text-gray-700">{e.category}</span>
                    </div>
                    <span className="font-bold text-red-500 text-xs">{formatPrice(e.amount)}</span>
                  </div>
                  <MiniBar value={e.amount} max={maxExpCat} />
                </div>
              ))}
              <div className="pt-2 border-t border-gray-50 flex justify-between text-xs font-bold">
                <span className="text-gray-500">Total egresos</span>
                <span className="text-red-500">{formatPrice(current.expenses)}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}