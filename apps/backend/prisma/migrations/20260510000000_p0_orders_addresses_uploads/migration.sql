-- AlterTable
ALTER TABLE "PickupOrder" ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultAddressId" UUID;

-- CreateTable
CREATE TABLE "PickupOrderPhoto" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupOrderPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("userId","key")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickupOrderPhoto_storageKey_key" ON "PickupOrderPhoto"("storageKey");

-- CreateIndex
CREATE INDEX "PickupOrderPhoto_orderId_idx" ON "PickupOrderPhoto"("orderId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_createdAt_idx" ON "IdempotencyRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "PickupOrder_customerId_createdAt_idx" ON "PickupOrder"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "PickupOrder_customerId_status_idx" ON "PickupOrder"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_defaultAddressId_key" ON "User"("defaultAddressId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultAddressId_fkey" FOREIGN KEY ("defaultAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrderPhoto" ADD CONSTRAINT "PickupOrderPhoto_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PickupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
