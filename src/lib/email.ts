import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BRAND_NAME = "GardenTech";
const BRAND_ACCENT = "#e8185a";
const BRAND_DARK = "#111827";
const BRAND_LIGHT = "#fdfcf8";

function currency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
}

function emailShell(content: string) {
  const appUrl = getAppUrl();
  return `
  <div style="margin:0;padding:0;background:${BRAND_LIGHT};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND_LIGHT};padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:${BRAND_DARK};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(17,24,39,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg, ${BRAND_ACCENT} 0%, #f43f5e 100%);padding:22px 28px;color:#fff;">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.9;margin-bottom:6px;">${BRAND_NAME}</div>
                <div style="font-size:20px;font-weight:700;line-height:1.2;">Notificaciones del pedido</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 24px;">${content}</td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <div style="border-top:1px solid #eef2f7;padding-top:18px;color:#6b7280;font-size:12px;line-height:1.7;">
                  <div style="font-weight:700;color:${BRAND_DARK};margin-bottom:6px;">${BRAND_NAME}</div>
                  <div>Si tienes dudas, responde este correo o revisa tu pedido en línea.</div>
                  <div style="margin-top:8px;">
                    <a href="${appUrl}" style="color:${BRAND_ACCENT};text-decoration:none;font-weight:700;">Ir al sitio</a>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendOrderConfirmation(data: {
  email: string;
  customerName: string;
  trackingToken: string;
  total: number;
  estimatedTime: string;
}) {
  const appUrl = getAppUrl();
  const html = emailShell(`
    <div style="margin:0 0 18px;">
      <div style="display:inline-block;background:rgba(232,24,90,0.08);color:${BRAND_ACCENT};padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Pedido finalizado</div>
    </div>
    <h1 style="margin:0 0 10px;font-size:28px;line-height:1.1;color:${BRAND_DARK};">Hola, ${data.customerName}</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#4b5563;">
      Recibimos tu comprobante correctamente. Tu pedido ya quedó listo para validación y seguimiento.
    </p>

    <div style="background:linear-gradient(180deg,#fff7fa 0%,#fff 100%);border:1px solid #ffd6e3;border-radius:20px;padding:22px;margin-bottom:18px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND_ACCENT};margin-bottom:8px;">Tu guía</div>
      <div style="font-size:30px;font-weight:800;letter-spacing:0.18em;color:${BRAND_DARK};margin-bottom:10px;">${data.trackingToken}</div>
      <div style="display:grid;gap:10px;font-size:14px;color:#374151;">
        <div><strong>Estado:</strong> Pago en validación</div>
        <div><strong>Total:</strong> ${currency(data.total)}</div>
        <div><strong>Entrega:</strong> ${data.estimatedTime || "Mismo día"}</div>
      </div>
    </div>

    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="${appUrl}/seguimiento?token=${data.trackingToken}" style="display:inline-block;background:${BRAND_ACCENT};color:#fff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:700;font-size:14px;">
        Ver seguimiento
      </a>
      <a href="${appUrl}/checkout/confirmacion?token=${data.trackingToken}" style="display:inline-block;background:#fff;border:1px solid #e5e7eb;color:${BRAND_DARK};text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:700;font-size:14px;">
        Ver guía final
      </a>
    </div>
  `);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: data.email,
    subject: `${BRAND_NAME} - Pedido ${data.trackingToken}`,
    html,
  });
}

export async function sendStatusUpdate(data: {
  email: string;
  customerName: string;
  trackingToken: string;
  statusLabel: string;
}) {
  const appUrl = getAppUrl();
  const html = emailShell(`
    <div style="margin:0 0 18px;">
      <div style="display:inline-block;background:rgba(232,24,90,0.08);color:${BRAND_ACCENT};padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Actualización del pedido</div>
    </div>
    <h1 style="margin:0 0 10px;font-size:28px;line-height:1.1;color:${BRAND_DARK};">Hola, ${data.customerName}</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#4b5563;">
      Tu pedido <strong>${data.trackingToken}</strong> cambió de estado.
    </p>

    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:20px;padding:24px;margin-bottom:18px;text-align:center;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Nuevo estado</div>
      <div style="font-size:26px;font-weight:800;color:${BRAND_DARK};">${data.statusLabel}</div>
    </div>

    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="${appUrl}/seguimiento?token=${data.trackingToken}" style="display:inline-block;background:${BRAND_ACCENT};color:#fff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:700;font-size:14px;">
        Ver seguimiento
      </a>
    </div>
  `);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: data.email,
    subject: `${BRAND_NAME} - Actualización ${data.trackingToken}`,
    html,
  });
}
