ALTER TABLE "Order" ADD COLUMN "preparationOrder" INTEGER;
ALTER TABLE "Order" ADD COLUMN "isUrgent" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Order_isUrgent_preparationOrder_createdAt_idx" ON "Order"("isUrgent", "preparationOrder", "createdAt");
