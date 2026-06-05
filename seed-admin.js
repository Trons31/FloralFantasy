/**
 * Crea el primer usuario administrador.
 * Uso: node seed-admin.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email    = "admin@gmail.com";
  const password = "admin123.";
  const name     = "Super Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, password: hash, name, role: "ADMIN" } });
    console.log("✅ Admin creado!");
    console.log("   Email:   ", email);
    console.log("   Password:", password);
    console.log("\n⚠️  Cambia la contraseña después del primer login.");
  } else {
    console.log("⚠️  Usuario ya existe:", email);
  }

  const occasions = [
    { name: "Amor", slug: "amor", subtitle: "& Romance", image: "/flowers/ramo1.jpg", sortOrder: 1, advanceOrderDays: 0 },
    { name: "Cumpleaños", slug: "cumpleanos", subtitle: "Celebra", image: "/flowers/ramo2.jpg", sortOrder: 2, advanceOrderDays: 0 },
    { name: "Bodas", slug: "bodas", subtitle: "& Eventos", image: "/flowers/ramo3.jpg", sortOrder: 3, advanceOrderDays: 2 },
    { name: "Condolencias", slug: "condolencias", subtitle: "Con amor", image: "/flowers/ramo4.jpg", sortOrder: 4, advanceOrderDays: 0 },
    { name: "Graduación", slug: "graduacion", subtitle: "Felicitaciones", image: "/flowers/ramo1.jpg", sortOrder: 5, advanceOrderDays: 1 },
    { name: "Recuperación", slug: "recuperacion", subtitle: "Pronto mejor", image: "/flowers/ramo2.jpg", sortOrder: 6, advanceOrderDays: 0 },
    { name: "De Autor", slug: "de-autor", subtitle: "Diseño único", image: "/flowers/ramo3.jpg", sortOrder: 7, advanceOrderDays: 1 },
    { name: "De Tulipán", slug: "de-tulipan", subtitle: "Elegancia floral", image: "/flowers/ramo4.jpg", sortOrder: 8, advanceOrderDays: 1 },
    { name: "De Bienvenida", slug: "de-bienvenida", subtitle: "Con cariño", image: "/flowers/ramo1.jpg", sortOrder: 9, advanceOrderDays: 0 },
  ];

  for (const occasion of occasions) {
    const existingOccasion = await prisma.occasion.findUnique({ where: { slug: occasion.slug } });
    if (existingOccasion) continue;

    await prisma.occasion.create({
      data: {
        name: occasion.name,
        slug: occasion.slug,
        subtitle: occasion.subtitle,
        advanceOrderDays: occasion.advanceOrderDays,
        sortOrder: occasion.sortOrder,
        isActive: true,
        images: {
          create: [
            {
              url: occasion.image,
              publicId: null,
              isMain: true,
              order: 0,
            },
          ],
        },
      },
    });
  }

  console.log("✅ Ocasiones iniciales verificadas/creadas.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
