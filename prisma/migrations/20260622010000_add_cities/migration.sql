CREATE TABLE IF NOT EXISTS "City" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "City_slug_key" ON "City"("slug");

ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "cityId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Order_cityId_fkey'
  ) THEN
    ALTER TABLE "Order"
    ADD CONSTRAINT "Order_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "City"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
