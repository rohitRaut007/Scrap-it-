-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('direct');

-- AlterTable
ALTER TABLE "PickupOrder" ADD COLUMN     "bookingSource" "BookingSource";
