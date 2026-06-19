import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";

const REVENUE_STATUSES = ["PAID", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    PENDING_PAYMENT_CONFIRMATION: "Pendiente de confirmación",
    PAYMENT_INVALID: "Pago inválido",
    PAID: "Pagado",
    PROCESSING: "En producción",
    READY: "Listo",
    OUT_FOR_DELIVERY: "En ruta",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };
  return labels[status] || status;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");
  const label = req.nextUrl.searchParams.get("label") || "Reporte financiero";
  const from = fromParam ? new Date(fromParam) : new Date(new Date().setHours(0, 0, 0, 0));
  const to = toParam ? new Date(toParam) : new Date(new Date().setHours(23, 59, 59, 999));

  const [orders, histories, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      select: {
        id: true,
        trackingToken: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.orderStatusHistory.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ["PROCESSING", "READY", "DELIVERED"] },
      },
      select: {
        status: true,
        createdAt: true,
        order: { select: { id: true, trackingToken: true, deliveryPhotoUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      select: {
        description: true,
        amount: true,
        category: true,
        date: true,
        registeredBy: true,
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const prepared = Array.from(new Map(
    histories
      .filter(item => item.status === "PROCESSING" || item.status === "READY")
      .map(item => [item.order.id, item])
  ).values());
  const delivered = Array.from(new Map(
    histories.filter(item => item.status === "DELIVERED").map(item => [item.order.id, item])
  ).values());
  const income = orders
    .filter(order => REVENUE_STATUSES.includes(order.status as typeof REVENUE_STATUSES[number]))
    .reduce((sum, order) => sum + order.total, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profit = income - expenseTotal;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(label)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;padding:34px;font-family:Arial,sans-serif;color:#0f172a;background:#fff;font-size:11px}
  .header{display:flex;justify-content:space-between;gap:24px;padding-bottom:18px;border-bottom:2px solid #f72d72}
  .brand{font-size:22px;font-weight:800}.brand span{color:#f72d72}.muted{color:#64748b}.right{text-align:right}.title{font-size:14px;font-weight:700}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.card{border:1px solid #e2e8f0;border-radius:12px;padding:14px}
  .card-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}.card-value{margin-top:6px;font-size:18px;font-weight:800}
  .green{color:#059669}.red{color:#e11d48}.violet{color:#7c3aed}.blue{color:#2563eb}
  h2{margin:22px 0 10px;font-size:14px} table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;page-break-inside:auto}
  tr{page-break-inside:avoid;page-break-after:auto} th{padding:8px 9px;background:#f8fafc;color:#64748b;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:8px 9px;border-top:1px solid #e2e8f0;vertical-align:top}.token{color:#f72d72;font-weight:700}.amount{color:#e11d48;font-weight:700;text-align:right}
  .badge{display:inline-block;padding:3px 7px;border-radius:999px;background:#f1f5f9;font-size:8px}.footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:9px}
  .empty{padding:18px;text-align:center;color:#94a3b8;border:1px solid #e2e8f0;border-radius:10px}
  @media print{body{padding:0}@page{size:A4;margin:14mm}thead{display:table-header-group}}
</style>
</head>
<body>
  <header class="header">
    <div><div class="brand">SUPER <span>ADMIN</span></div><div class="muted">Reporte financiero y operativo</div></div>
    <div class="right"><div class="title">${escapeHtml(label)}</div><div class="muted">${formatDate(from)} - ${formatDate(to)}</div><div class="muted">Generado: ${formatDate(new Date())}</div></div>
  </header>

  <section class="summary">
    <div class="card"><div class="card-label">Ingresos</div><div class="card-value green">${formatCOP(income)}</div></div>
    <div class="card"><div class="card-label">Egresos</div><div class="card-value red">${formatCOP(expenseTotal)}</div></div>
    <div class="card"><div class="card-label">Balance</div><div class="card-value ${profit >= 0 ? "violet" : "red"}">${formatCOP(profit)}</div></div>
    <div class="card"><div class="card-label">Pedidos</div><div class="card-value blue">${orders.length}</div><div class="muted">${delivered.length} entregados</div></div>
  </section>

  <h2>Pedidos del período</h2>
  ${orders.length ? `<table><thead><tr><th>Token</th><th>Cliente</th><th>Productos</th><th>Estado</th><th>Fecha</th><th style="text-align:right">Total</th></tr></thead><tbody>${orders.map(order => `<tr><td class="token">${escapeHtml(order.trackingToken)}</td><td>${escapeHtml(order.customerName)}<br><span class="muted">${escapeHtml(order.customerPhone)}</span></td><td>${escapeHtml(order.items.map(item => `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.product.name}`).join(", "))}</td><td><span class="badge">${escapeHtml(statusLabel(order.status))}</span></td><td>${formatDateTime(order.createdAt)}</td><td style="text-align:right;font-weight:700">${formatCOP(order.total)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No hubo pedidos en el período.</div>`}

  <h2>Actividad de preparación y entrega</h2>
  ${histories.length ? `<table><thead><tr><th>Actividad</th><th>Pedido</th><th>Evidencia</th><th>Fecha</th></tr></thead><tbody>${histories.map(item => `<tr><td>${item.status === "DELIVERED" ? "Pedido entregado" : item.status === "READY" ? "Pedido listo" : "Pedido en preparación"}</td><td class="token">${escapeHtml(item.order.trackingToken)}</td><td>${item.order.deliveryPhotoUrl ? "Con evidencia" : "-"}</td><td>${formatDateTime(item.createdAt)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No hubo actividad operativa en el período.</div>`}

  <h2>Egresos del período</h2>
  ${expenses.length ? `<table><thead><tr><th>Descripción</th><th>Categoría</th><th>Responsable</th><th>Fecha</th><th style="text-align:right">Monto</th></tr></thead><tbody>${expenses.map(expense => `<tr><td>${escapeHtml(expense.description)}</td><td>${escapeHtml(expense.category)}</td><td>${escapeHtml(expense.registeredBy || "Sin responsable")}</td><td>${formatDateTime(expense.date)}</td><td class="amount">-${formatCOP(expense.amount)}</td></tr>`).join("")}<tr><td colspan="4" style="font-weight:700">TOTAL EGRESOS</td><td class="amount">-${formatCOP(expenseTotal)}</td></tr></tbody></table>` : `<div class="empty">No hubo egresos en el período.</div>`}

  <footer class="footer">Reporte generado por Super Admin · Incluye información financiera y operativa del período seleccionado.</footer>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}