/**
 * Crea el primer usuario administrador.
 * Uso: node seed-admin.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email    = "admin@fantasiafloral.com";
  const password = "Admin123!";
  const name     = "Super Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { console.log("⚠️  Usuario ya existe:", email); return; }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, password: hash, name, role: "ADMIN" } });
  console.log("✅ Admin creado!");
  console.log("   Email:   ", email);
  console.log("   Password:", password);
  console.log("\n⚠️  Cambia la contraseña después del primer login.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
