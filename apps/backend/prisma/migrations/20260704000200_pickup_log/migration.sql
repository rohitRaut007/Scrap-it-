-- CreateTable
CREATE TABLE "PickupLog" (
    "id" UUID NOT NULL,
    "collectorId" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "addressText" TEXT,
    "notes" TEXT,
    "totalWeightKg" DOUBLE PRECISION,
    "payoutInr" DOUBLE PRECISION,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupLogCategory" (
    "pickupLogId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "rateInrPerKg" DOUBLE PRECISION NOT NULL,
    "payoutInr" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PickupLogCategory_pkey" PRIMARY KEY ("pickupLogId","categoryId")
);

-- CreateIndex
CREATE INDEX "PickupLog_collectorId_loggedAt_idx" ON "PickupLog"("collectorId", "loggedAt");

-- AddForeignKey
ALTER TABLE "PickupLog" ADD CONSTRAINT "PickupLog_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupLogCategory" ADD CONSTRAINT "PickupLogCategory_pickupLogId_fkey" FOREIGN KEY ("pickupLogId") REFERENCES "PickupLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupLogCategory" ADD CONSTRAINT "PickupLogCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
