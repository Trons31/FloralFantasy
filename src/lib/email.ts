import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendOrderConfirmation(data: {
  email: string; customerName: string; trackingToken: string;
  total: number; estimatedTime: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: data.email,
    subject: `🌸 Pedido confirmado — ${data.trackingToken}`,
    html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fdfcf8;padding:32px;border-radius:16px">
      <h1 style="color:#1d4ed8">¡Gracias por tu compra! 🌸</h1>
      <p>Hola <strong>${data.customerName}</strong>, tu pedido fue recibido.</p>
      <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
        <p style="color:#666;margin-bottom:4px">Token de seguimiento</p>
        <h2 style="color:#1d4ed8;font-size:32px;letter-spacing:4px;margin:0">${data.trackingToken}</h2>
      </div>
      <p><strong>Total:</strong> ${new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(data.total)}</p>
      <p><strong>Entrega estimada:</strong> ${data.estimatedTime}</p>
      <a href="${appUrl}/seguimiento?token=${data.trackingToken}"
         style="display:inline-block;background:#1d4ed8;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
        Ver estado de mi pedido →
      </a>
    </div>`,
  });
}

export async function sendStatusUpdate(data: {
  email: string; customerName: string; trackingToken: string; statusLabel: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: data.email,
    subject: `🌸 Actualización — ${data.trackingToken}`,
    html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fdfcf8;padding:32px;border-radius:16px">
      <h2 style="color:#1d4ed8">Actualización de pedido 🌸</h2>
      <p>Hola <strong>${data.customerName}</strong>, tu pedido <strong>${data.trackingToken}</strong>:</p>
      <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
        <h3 style="color:#1d4ed8;font-size:20px">${data.statusLabel}</h3>
      </div>
      <a href="${appUrl}/seguimiento?token=${data.trackingToken}"
         style="display:inline-block;background:#1d4ed8;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">
        Ver mi pedido →
      </a>
    </div>`,
  });
}
