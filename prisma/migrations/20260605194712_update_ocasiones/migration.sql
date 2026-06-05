-- CreateTable
CREATE TABLE "Occasion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "advanceOrderDays" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccasionImage" (
    "id" TEXT NOT NULL,
    "occasionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OccasionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Occasion_slug_key" ON "Occasion"("slug");

-- AddForeignKey
ALTER TABLE "OccasionImage" ADD CONSTRAINT "OccasionImage_occasionId_fkey" FOREIGN KEY ("occasionId") REFERENCES "Occasion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
