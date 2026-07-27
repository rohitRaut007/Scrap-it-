/**
 * TOP-UP SEED — dual bill-type billing fixtures
 * ══════════════════════════════════════════════════
 * Ensures the "same address, two bill types" reference scenario exists for
 * manual QA of the Residential Bill / Commercial Invoice templates: a
 * CORPORATE client "Home Rising Commercial" at "VTP Aethereus", sharing the
 * address + GSTIN of the SOCIETY client already used for the residential
 * fixture (created interactively, not by a script — left untouched here).
 *
 * Idempotent: fixed UUID, so re-running this UPSERTs instead of duplicating.
 * Not wired into any default seed/CI run — invoke manually:
 *   node prisma/seed-invoice-fixtures.js [collectorEmail]
 *
 * Login: collector@scrapit.app / Collector@123  (Sunil Kamble) — default target.
 * ══════════════════════════════════════════════════
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COLLECTOR_EMAIL = process.argv[2] || 'collector@scrapit.app';

const SHARED_ADDRESS =
  'VTP House, 3rd Floor, No. 34, Near Shakti Sports, Wadgaon Sheri, Pune, Maharashtra - 411060';
const SHARED_GSTIN = '27AANFH1298J1ZV';

// Fixed ID (44444444- namespace — unused elsewhere) so this script is safe to re-run.
const COMMERCIAL_CLIENT_ID = '44444444-0000-4000-a000-000000000001';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: COLLECTOR_EMAIL },
    include: { collector: true },
  });
  if (!user?.collector) {
    throw new Error(`No collector found for ${COLLECTOR_EMAIL} — run the main seed first.`);
  }
  const collectorId = user.collector.id;

  const commercial = await prisma.client.upsert({
    where: { id: COMMERCIAL_CLIENT_ID },
    update: {},
    create: {
      id: COMMERCIAL_CLIENT_ID,
      collectorId,
      type: 'CORPORATE',
      entityName: 'Home Rising Commercial',
      siteName: 'VTP Aethereus',
      premisesType: 'Commercial Premises',
      gstin: SHARED_GSTIN,
      addressText: SHARED_ADDRESS,
    },
  });

  console.log(`Commercial fixture client ready: ${commercial.entityName} (${commercial.id})`);
  console.log(
    'Pair this with the existing SOCIETY "VTP atherus" client (same collector) to exercise both bill templates.',
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
