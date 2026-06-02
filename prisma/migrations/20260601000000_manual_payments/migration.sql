-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PaymentMethodType" AS ENUM ('QR', 'BANK_ACCOUNT', 'INSTRUCTIONS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
DO $$ BEGIN
    ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT_CONFIRMATION';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_INVALID';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentMethod" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "details" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProofPublicId" TEXT;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Order"
    ADD CONSTRAINT "Order_paymentMethodId_fkey"
    FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
