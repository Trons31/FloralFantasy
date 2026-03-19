import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 }).format(n);
}
function statusLabel(s: string) {
  const m: Record<string,string> = { PENDING:"Pendiente", PAID:"Pagado", PROCESSING:"Procesando", READY:"Listo", OUT_FOR_DELIVERY:"En camino", DELIVERED:"Entregado", CANCELLED:"Cancelado" };
  return m[s] || s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from  = searchParams.get("from");
  const to    = searchParams.get("to");
  const label = searchParams.get("label") || "Reporte";

  const where: any = { status: { notIn: ["CANCELLED"] } };
  if (from) where.createdAt = { ...where.createdAt, gte: new Date(from) };
  if (to)   where.createdAt = { ...where.createdAt, lte: new Date(to) };

  const expWhere: any = {};
  if (from) expWhere.date = { ...expWhere.date, gte: new Date(from) };
  if (to)   expWhere.date = { ...expWhere.date, lte: new Date(to) };

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({ where, include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ where: expWhere }),
  ]);

  const totalIncome   = orders.reduce((s, o) => s + o.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const ganancia      = totalIncome - totalExpenses;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:32px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #e8185a;padding-bottom:16px}
.brand{font-size:22px;font-weight:bold;color:#e8185a}
.brand-sub{font-size:11px;color:#999;margin-top:2px}
.report-title{text-align:right}
.report-title h2{font-size:16px;color:#333}
.report-title p{font-size:10px;color:#999;margin-top:4px}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.summary-card{background:#f9fafb;border:1px solid #f0f0f0;border-radius:8px;padding:14px}
.summary-card .label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.summary-card .value{font-size:18px;font-weight:bold}
.green{color:#16a34a}.red{color:#dc2626}.pink{color:#e8185a}
h3{font-size:13px;font-weight:bold;color:#333;margin-bottom:10px;margin-top:20px;padding-bottom:6px;border-bottom:1px solid #f0f0f0}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#fdf2f8;color:#c40d47;font-weight:600;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
td{padding:8px 10px;border-bottom:1px solid #f9f9f9;vertical-align:top}
tr:nth-child(even) td{background:#fafafa}
.token{font-family:monospace;color:#e8185a;font-size:10px}
.status{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:600}
.sd{background:#dcfce7;color:#16a34a}.sp{background:#dbeafe;color:#2563eb}.ss{background:#fef3c7;color:#d97706}.so{background:#f3f4f6;color:#6b7280}
.total-row td{font-weight:bold;background:#fdf2f8;color:#c40d47}
.footer{margin-top:32px;padding-top:12px;border-top:1px solid #f0f0f0;text-align:center;font-size:10px;color:#bbb}
@media print{@page{margin:20mm}}
</style></head><body>
<div class="header">
  <div><div class="brand">Fantasía Floral</div><div class="brand-sub">Floristería</div></div>
  <div class="report-title">
    <h2>${label}</h2>
    <p>Generado el ${new Date().toLocaleDateString("es-CO",{dateStyle:"long"})}</p>
    ${from?`<p>Desde: ${new Date(from).toLocaleDateString("es-CO",{dateStyle:"medium"})}</p>`:""}
    ${to?`<p>Hasta: ${new Date(to).toLocaleDateString("es-CO",{dateStyle:"medium"})}</p>`:""}
  </div>
</div>
<div class="summary">
  <div class="summary-card"><div class="label">Pedidos</div><div class="value">${orders.length}</div></div>
  <div class="summary-card"><div class="label">Ingresos</div><div class="value green">${formatCOP(totalIncome)}</div></div>
  <div class="summary-card"><div class="label">Egresos</div><div class="value red">${formatCOP(totalExpenses)}</div></div>
  <div class="summary-card"><div class="label">Ganancia neta</div><div class="value ${ganancia>=0?"pink":"red"}">${formatCOP(ganancia)}</div></div>
</div>
<h3>Detalle de pedidos</h3>
<table>
  <thead><tr><th>Token</th><th>Cliente</th><th>Productos</th><th>Estado</th><th>Fecha</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>
    ${orders.map(o=>`<tr>
      <td class="token">${o.trackingToken}</td>
      <td>${o.customerName}<br/><span style="color:#999;font-size:10px">${o.customerPhone}</span></td>
      <td>${o.items.map(i=>`${i.quantity>1?`x${i.quantity} `:""}${i.product?.name||"-"}`).join(", ")}</td>
      <td><span class="status ${o.status==="DELIVERED"?"sd":o.status==="PAID"?"sp":o.status==="PROCESSING"?"ss":"so"}">${statusLabel(o.status)}</span></td>
      <td style="white-space:nowrap">${new Date(o.createdAt).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"})}</td>
      <td style="text-align:right;font-weight:600">${formatCOP(o.total)}</td>
    </tr>`).join("")}
    <tr class="total-row"><td colspan="5">TOTAL</td><td style="text-align:right">${formatCOP(totalIncome)}</td></tr>
  </tbody>
</table>
${expenses.length>0?`
<h3>Egresos registrados</h3>
<table>
  <thead><tr><th>Descripción</th><th>Categoría</th><th>Fecha</th><th style="text-align:right">Monto</th></tr></thead>
  <tbody>
    ${expenses.map(e=>`<tr>
      <td>${e.description}</td><td>${e.category}</td>
      <td>${new Date(e.date).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"})}</td>
      <td style="text-align:right;color:#dc2626;font-weight:600">${formatCOP(e.amount)}</td>
    </tr>`).join("")}
    <tr class="total-row"><td colspan="3">TOTAL EGRESOS</td><td style="text-align:right;color:#dc2626">${formatCOP(totalExpenses)}</td></tr>
  </tbody>
</table>`:""}
<div class="footer">Fantasía Floral · Reporte generado automáticamente · ${new Date().toLocaleDateString("es-CO",{dateStyle:"long"})}</div>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}