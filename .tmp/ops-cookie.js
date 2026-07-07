const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();
const secret = process.env.NEXTAUTH_SECRET || process.env.OPERATIONS_SESSION_SECRET || "";
function sign(value) { return crypto.createHmac("sha256", secret).update(value).digest("base64url"); }
function encode(session) { const payload = Buffer.from(JSON.stringify(session)).toString("base64url"); return `${payload}.${sign(payload)}`; }
(async () => {
  try {
    const user = await prisma.user.findFirst({ where: { role: { in: ["PREPARADOR", "REPARTIDOR", "CORREDOR"] } }, select: { id: true, name: true, email: true, role: true } });
    console.log("USER", JSON.stringify(user));
    if (!user) return;
    const token = encode({ id: user.id, name: user.name, role: user.role, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    console.log("TOKEN", token);
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await prisma.$disconnect(); }
})();
