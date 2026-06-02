-- Add admin customization fields to orders
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "manualAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0;
