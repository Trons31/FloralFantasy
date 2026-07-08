ALTER TABLE "ProductFlower" ADD COLUMN "quantityMin" INTEGER;
ALTER TABLE "ProductFlower" ADD COLUMN "quantityMax" INTEGER;

UPDATE "ProductFlower"
SET "quantityMin" = "quantity",
    "quantityMax" = "quantity"
WHERE "quantityMin" IS NULL
  AND "quantityMax" IS NULL;
