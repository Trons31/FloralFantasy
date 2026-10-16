-- Spec 012: tarjetas de dedicatoria por arreglo. Migración solo aditiva.
CREATE TABLE "CardOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxChars" INTEGER NOT NULL DEFAULT 200,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardOption_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrderItem" ADD COLUMN "cardOptionId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "cardName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "cardPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "cardMessage" TEXT;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_cardOptionId_fkey" FOREIGN KEY ("cardOptionId") REFERENCES "CardOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Opciones iniciales (las de la referencia). Se editan desde /dashboard/tarjetas.
INSERT INTO "CardOption" ("id", "name", "description", "price", "maxChars", "sortOrder") VALUES
  ('card_basica',  'Tarjeta básica',  'Incluida',                        0,     200, 0),
  ('card_mediana', 'Tarjeta mediana', 'Postal 10×15 en papel lino',      15000, 450, 1),
  ('card_grande',  'Tarjeta grande',  'Tamaño carta en papel lino',      20000, 900, 2);
