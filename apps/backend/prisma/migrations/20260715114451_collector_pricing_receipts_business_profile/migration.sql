-- AlterTable
ALTER TABLE "Collector" ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "receiptSequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shopAddressText" TEXT,
ADD COLUMN     "shopName" TEXT,
ADD COLUMN     "showBusinessDetailsOnReceipt" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PickupLog" ADD COLUMN     "receiptNumber" INTEGER;

-- AlterTable
ALTER TABLE "PickupOrder" ADD COLUMN     "receiptNumber" INTEGER;

-- CreateTable
CREATE TABLE "CollectorCategoryRate" (
    "id" UUID NOT NULL,
    "collectorId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "rateInrPerKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectorCategoryRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectorCategoryRate_collectorId_categoryId_key" ON "CollectorCategoryRate"("collectorId", "categoryId");

-- AddForeignKey
ALTER TABLE "CollectorCategoryRate" ADD CONSTRAINT "CollectorCategoryRate_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorCategoryRate" ADD CONSTRAINT "CollectorCategoryRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
