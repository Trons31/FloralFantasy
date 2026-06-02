/*
  Warnings:

  - You are about to drop the column `wompiTxId` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('CLIENT', 'ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'PREPARADOR';
ALTER TYPE "Role" ADD VALUE 'REPARTIDOR';
ALTER TYPE "Role" ADD VALUE 'CORREDOR';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "receiptPhotoUrl" TEXT,
ADD COLUMN     "receiptPublicId" TEXT,
ADD COLUMN     "registeredBy" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "wompiTxId",
ADD COLUMN     "deliveryPhotoPublicId" TEXT,
ADD COLUMN     "deliveryPhotoUrl" TEXT,
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'CLIENT';

-- AlterTable
ALTER TABLE "PaymentMethod" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pin" TEXT;
