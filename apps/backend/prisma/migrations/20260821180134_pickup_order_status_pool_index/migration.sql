-- CreateIndex
CREATE INDEX "PickupOrder_status_collectorId_scheduledAt_idx" ON "PickupOrder"("status", "collectorId", "scheduledAt");
