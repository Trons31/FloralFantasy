const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const medellin = await prisma.city.upsert({
    where: { slug: "medellin" },
    update: {
      name: "Medellín",
      isActive: true,
      sortOrder: 0,
    },
    create: {
      name: "Medellín",
      slug: "medellin",
      isActive: true,
      sortOrder: 0,
    },
  });

  await prisma.city.updateMany({
    where: { id: { not: medellin.id } },
    data: { isActive: false },
  });

  console.log(`Ciudad disponible: ${medellin.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
