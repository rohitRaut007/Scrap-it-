-- AlterEnum
ALTER TYPE "CollectorStatus" ADD VALUE 'removed';

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "targetCollectorId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetCollectorId_createdAt_idx" ON "AdminAuditLog"("targetCollectorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_targetCollectorId_fkey" FOREIGN KEY ("targetCollectorId") REFERENCES "Collector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
