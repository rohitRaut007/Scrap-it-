-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('created', 'assigned', 'en_route', 'arriving', 'completed', 'cancelled', 'declined');

-- CreateEnum
CREATE TYPE "CollectorStatus" AS ENUM ('active', 'suspended');

-- AlterTable
ALTER TABLE "Collector" ADD COLUMN     "status" "CollectorStatus" NOT NULL DEFAULT 'active';

-- AlterTable
-- Cast existing eventType text values into the new enum in place (every
-- value ever written by the app — created/assigned/en_route/arriving/
-- completed/cancelled/declined — matches an enum label exactly), instead
-- of Prisma's default drop-and-recreate which would destroy existing rows.
ALTER TABLE "PickupTimeline" ALTER COLUMN "eventType" TYPE "TimelineEventType" USING ("eventType"::"TimelineEventType");

-- CreateTable
CREATE TABLE "Rating" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "collectorId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_orderId_key" ON "Rating"("orderId");

-- CreateIndex
CREATE INDEX "Rating_collectorId_idx" ON "Rating"("collectorId");

-- CreateIndex
CREATE INDEX "PickupOrder_collectorId_status_idx" ON "PickupOrder"("collectorId", "status");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PickupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
