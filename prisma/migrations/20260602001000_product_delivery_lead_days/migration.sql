-- Add delivery lead time in days for products that are delivered later
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "deliveryLeadDays" INTEGER NOT NULL DEFAULT 0;
