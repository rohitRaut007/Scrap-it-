-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('SOCIETY', 'CORPORATE', 'RESTAURANT', 'FACTORY', 'OFFICE', 'PROCESSOR');

-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- AlterTable: Client — add "type" nullable first, backfill, then constrain
ALTER TABLE "Client" ADD COLUMN     "type" "ClientType",
ADD COLUMN     "entityName" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "billToAddressText" TEXT;

UPDATE "Client" SET "type" = 'SOCIETY'
  WHERE "type" IS NULL AND "siteType" ILIKE '%residential%';
UPDATE "Client" SET "type" = 'CORPORATE'
  WHERE "type" IS NULL AND ("siteType" ILIKE '%commercial%' OR "siteType" ILIKE '%corporate%');
-- Fallback for anything unmatched/blank — safer to default to Commercial: the
-- commercial template surfaces more visible boilerplate (GST/meta box), so a
-- mis-classified client is easy for the collector to spot and correct.
UPDATE "Client" SET "type" = 'CORPORATE' WHERE "type" IS NULL;

ALTER TABLE "Client" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable: Invoice — add "billType" + commercial-only fields
ALTER TABLE "Invoice" ADD COLUMN     "billType" "BillType",
ADD COLUMN     "referencePoNumber" TEXT,
ADD COLUMN     "termsOfPayment" TEXT,
ADD COLUMN     "termsAndConditions" TEXT;

UPDATE "Invoice" i SET "billType" = CASE WHEN c."type" = 'SOCIETY' THEN 'RESIDENTIAL' ELSE 'COMMERCIAL' END::"BillType"
FROM "Client" c WHERE c."id" = i."clientId" AND i."billType" IS NULL;

ALTER TABLE "Invoice" ALTER COLUMN "billType" SET NOT NULL;

-- AlterTable: Collector — split the single invoiceSequence into two independent
-- per-bill-type counters, preserving the existing high-water-mark under
-- residentialInvoiceSequence (consistent with the backfill above, which treats
-- every pre-existing invoice as RESIDENTIAL), plus the new default T&C field.
ALTER TABLE "Collector" ADD COLUMN     "residentialInvoiceSequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "commercialInvoiceSequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "defaultTermsAndConditions" TEXT;

UPDATE "Collector" SET "residentialInvoiceSequence" = "invoiceSequence";

ALTER TABLE "Collector" DROP COLUMN "invoiceSequence";
