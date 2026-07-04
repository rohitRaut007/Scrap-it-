-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "baseRateInr" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Collector" ADD COLUMN     "bookingSlug" TEXT,
ADD COLUMN     "serviceArea" TEXT;

-- AlterTable
ALTER TABLE "PickupOrder" ADD COLUMN     "payoutInr" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PickupOrderCategory" ADD COLUMN     "payoutInr" DOUBLE PRECISION,
ADD COLUMN     "rateInrPerKg" DOUBLE PRECISION,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Collector_bookingSlug_key" ON "Collector"("bookingSlug");

