-- Add per-item customization data for admin-built orders
ALTER TABLE "OrderItem"
ADD COLUMN IF NOT EXISTS "customization" JSONB;
