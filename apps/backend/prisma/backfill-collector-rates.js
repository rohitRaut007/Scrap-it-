/**
 * ONE-OFF BACKFILL — Collector-owned pricing rollout
 * ═══════════════════════════════════════════════════
 * Seeds a CollectorCategoryRate for every existing Collector × active
 * Category, copying today's Category.baseRateInr as that collector's
 * starting rate (which they can then edit in the portal).
 *
 * Run this AFTER the schema migration and BEFORE deploying the new backend
 * code — so no existing collector is ever blocked from logging a pickup by
 * the "set your rate first" guard the moment the new backend goes live.
 *
 * Safe to re-run: checks for an existing row per collector×category before
 * creating one, so it never overwrites a rate a collector has already
 * customized (or a rate this script already backfilled on a prior run).
 * ═══════════════════════════════════════════════════
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [collectors, categories] = await Promise.all([
    prisma.collector.findMany({ select: { id: true } }),
    prisma.category.findMany({ where: { active: true }, select: { id: true, baseRateInr: true } }),
  ]);

  console.log(`\n[backfill] ${collectors.length} collectors × ${categories.length} active categories`);

  let created = 0;
  let skipped = 0;
  for (const collector of collectors) {
    for (const category of categories) {
      const existing = await prisma.collectorCategoryRate.findUnique({
        where: {
          collectorId_categoryId: { collectorId: collector.id, categoryId: category.id },
        },
        select: { id: true },
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      await prisma.collectorCategoryRate.create({
        data: {
          collectorId: collector.id,
          categoryId: category.id,
          rateInrPerKg: category.baseRateInr,
        },
      });
      created += 1;
    }
  }

  console.log(`[backfill] created ${created} rate rows, skipped ${skipped} already-set rows`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
