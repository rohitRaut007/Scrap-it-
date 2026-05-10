-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'collector', 'admin');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('scheduled', 'assigned', 'en_route', 'arriving', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('push', 'email', 'sms', 'in_app');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rateLabel" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collector" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vehicleInfo" TEXT,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupOrder" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "addressId" UUID NOT NULL,
    "collectorId" UUID,
    "etaMinutes" INTEGER,
    "totalWeightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupOrderCategory" (
    "pickupOrderId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "PickupOrderCategory_pkey" PRIMARY KEY ("pickupOrderId","categoryId")
);

-- CreateTable
CREATE TABLE "PickupTimeline" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "PickupTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app',
    "title" TEXT,
    "body" TEXT,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Collector_userId_key" ON "Collector"("userId");

-- CreateIndex
CREATE INDEX "PickupTimeline_orderId_occurredAt_idx" ON "PickupTimeline"("orderId", "occurredAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collector" ADD CONSTRAINT "Collector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrderCategory" ADD CONSTRAINT "PickupOrderCategory_pickupOrderId_fkey" FOREIGN KEY ("pickupOrderId") REFERENCES "PickupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrderCategory" ADD CONSTRAINT "PickupOrderCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupTimeline" ADD CONSTRAINT "PickupTimeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PickupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
