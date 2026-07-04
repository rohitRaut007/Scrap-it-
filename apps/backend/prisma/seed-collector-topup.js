/**
 * TOP-UP SEED — Collector Portal demo data
 * ══════════════════════════════════════════════════
 * Adds realistic orders on top of the main seed so every screen in
 * apps/collector has something to show: active orders in every status,
 * a spread of completed pickups for the earnings chart, a cancelled
 * order, and a richer unclaimed pool (including edge cases).
 *
 * Non-destructive: uses fixed UUIDs so re-running this script UPSERTS
 * instead of duplicating rows. Safe to run more than once.
 *
 * Login: collector@scrapit.app / Collector@123  (Sunil Kamble)
 * ══════════════════════════════════════════════════
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NOW = new Date();
const D = 86_400_000;
const H = 3_600_000;
const daysAgo = (n) => new Date(+NOW - n * D);
const daysAhead = (n) => new Date(+NOW + n * D);
const shift = (base, ms) => new Date(+base + ms);
const todayAt = (h, m = 0) => {
  const d = new Date(NOW);
  d.setHours(h, m, 0, 0);
  return d;
};

const SUNIL_EMAIL = 'collector@scrapit.app';

// Existing seed customer/address IDs (from prisma/seed.js — reused, not duplicated)
const CUST = {
  ANJALI: '11111111-0000-4000-a000-000000000003',
  SANJAY: '11111111-0000-4000-a000-000000000012',
  POOJA: '11111111-0000-4000-a000-000000000013',
  NEHA: '11111111-0000-4000-a000-000000000017',
  AMIT: '11111111-0000-4000-a000-000000000016',
  SUNITA: '11111111-0000-4000-a000-000000000009',
  MEENA: '11111111-0000-4000-a000-000000000005',
  RAJESH: '11111111-0000-4000-a000-000000000010',
  DEEPA: '11111111-0000-4000-a000-000000000007',
  VIKRAM: '11111111-0000-4000-a000-000000000006',
  KAVITHA: '11111111-0000-4000-a000-000000000015',
  LEELA: '11111111-0000-4000-a000-000000000011',
};

// Fixed order IDs for this top-up (prefix 33333333- so they never collide
// with the main seed's 11111111.../22222222... namespaces).
const OID = {
  EN_ROUTE: '33333333-0000-4000-a000-000000000001',
  DONE_1: '33333333-0000-4000-a000-000000000002',
  DONE_2: '33333333-0000-4000-a000-000000000003',
  DONE_3: '33333333-0000-4000-a000-000000000004',
  DONE_4: '33333333-0000-4000-a000-000000000005',
  DONE_5: '33333333-0000-4000-a000-000000000006',
  CANCELLED: '33333333-0000-4000-a000-000000000007',
  AVAIL_TODAY: '33333333-0000-4000-a000-000000000008',
  AVAIL_MULTI: '33333333-0000-4000-a000-000000000009',
  AVAIL_NO_CATS: '33333333-0000-4000-a000-000000000010',
  AVAIL_FAR: '33333333-0000-4000-a000-000000000011',
};

async function addressFor(userId) {
  const addr = await prisma.address.findFirst({ where: { userId } });
  if (!addr) throw new Error(`No seeded address for user ${userId} — run prisma/seed.js first`);
  return addr.id;
}

/** Upsert an order by fixed id: delete any prior categories/timeline, then recreate. */
async function upsertOrder(id, data, catLines, timelineEvents) {
  await prisma.pickupOrder.deleteMany({ where: { id } });
  return prisma.pickupOrder.create({
    data: {
      id,
      ...data,
      categories: { create: catLines },
      timeline: {
        create: timelineEvents.map((e) => ({
          eventType: e.type,
          occurredAt: e.at,
          metadata: e.meta ?? null,
        })),
      },
    },
  });
}

function completedCategoryLines(items, catId) {
  // items: [{ categoryId, weightKg, rateInrPerKg }]
  return items.map((i) => ({
    categoryId: i.categoryId,
    weightKg: i.weightKg,
    rateInrPerKg: i.rateInrPerKg,
    payoutInr: Math.round(i.weightKg * i.rateInrPerKg),
  }));
}

async function main() {
  const sunilUser = await prisma.user.findUnique({ where: { email: SUNIL_EMAIL } });
  if (!sunilUser) {
    throw new Error(
      `No user with email ${SUNIL_EMAIL} — run the provisioning step before this top-up.`,
    );
  }
  const sunil = await prisma.collector.findUnique({ where: { userId: sunilUser.id } });
  const sunilId = sunil.id;

  const cats = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.name, c]),
  );
  const rate = (name) => cats[name].baseRateInr;
  const id = (name) => cats[name].id;

  console.log(`Topping up demo data for collector ${sunilUser.email} (${sunilId})`);

  // ── 1. EN_ROUTE — exercises the "I've arrived" action + stepper step 2 ──
  {
    const addressId = await addressFor(CUST.ANJALI);
    const created = shift(NOW, -3 * H);
    await upsertOrder(
      OID.EN_ROUTE,
      {
        customerId: CUST.ANJALI,
        status: 'assigned', // will be overwritten below to en_route via data.status
        scheduledAt: todayAt(18, 0),
        addressId,
        collectorId: sunilId,
        notes: 'Scrap bags kept near the main gate. Ring the bell twice.',
        createdAt: created,
      },
      [{ categoryId: id('Hard Plastic') }],
      [
        { type: 'created', at: created },
        { type: 'assigned', at: shift(created, 20 * 60000), meta: { actorId: sunilUser.id, actorRole: 'collector', selfAccepted: true } },
        { type: 'en_route', at: shift(created, 90 * 60000), meta: { actorId: sunilUser.id, actorRole: 'collector', previousStatus: 'assigned' } },
      ],
    );
    await prisma.pickupOrder.update({ where: { id: OID.EN_ROUTE }, data: { status: 'en_route' } });
  }

  // ── 2. Completed pickups spread across the last 14 days (earnings chart) ──
  const completions = [
    {
      id: OID.DONE_1,
      customerId: CUST.SANJAY,
      daysBack: 1,
      items: [
        { categoryId: id('Copper Wire'), weightKg: 2.5, rateInrPerKg: rate('Copper Wire') },
        { categoryId: id('Iron / Steel'), weightKg: 8, rateInrPerKg: rate('Iron / Steel') },
      ],
    },
    {
      id: OID.DONE_2,
      customerId: CUST.POOJA,
      daysBack: 3,
      items: [
        { categoryId: id('Newspaper'), weightKg: 18, rateInrPerKg: rate('Newspaper') },
        { categoryId: id('Cardboard'), weightKg: 12, rateInrPerKg: rate('Cardboard') },
      ],
    },
    {
      id: OID.DONE_3,
      customerId: CUST.NEHA,
      daysBack: 6,
      items: [{ categoryId: id('Aluminium'), weightKg: 6, rateInrPerKg: rate('Aluminium') }],
    },
    {
      id: OID.DONE_4,
      customerId: CUST.AMIT,
      daysBack: 9,
      items: [
        { categoryId: id('Glass Bottles'), weightKg: 25, rateInrPerKg: rate('Glass Bottles') },
        { categoryId: id('E-Waste'), weightKg: 1.5, rateInrPerKg: rate('E-Waste') },
      ],
    },
    {
      id: OID.DONE_5,
      customerId: CUST.SUNITA,
      daysBack: 12,
      items: [{ categoryId: id('Hard Plastic'), weightKg: 22, rateInrPerKg: rate('Hard Plastic') }],
    },
  ];

  for (const c of completions) {
    const addressId = await addressFor(c.customerId);
    const created = shift(daysAgo(c.daysBack), -2 * H);
    const assignedAt = shift(created, 15 * 60000);
    const enRouteAt = shift(assignedAt, 30 * 60000);
    const arrivingAt = shift(enRouteAt, 40 * 60000);
    const completedAt = shift(arrivingAt, 25 * 60000);
    const totalWeightKg = Math.round(c.items.reduce((s, i) => s + i.weightKg, 0) * 100) / 100;
    const payoutInr = c.items.reduce((s, i) => s + Math.round(i.weightKg * i.rateInrPerKg), 0);

    await upsertOrder(
      c.id,
      {
        customerId: c.customerId,
        status: 'completed',
        scheduledAt: shift(created, 3 * H),
        addressId,
        collectorId: sunilId,
        totalWeightKg,
        payoutInr,
        completedAt,
        createdAt: created,
      },
      completedCategoryLines(c.items),
      [
        { type: 'created', at: created },
        { type: 'assigned', at: assignedAt, meta: { actorId: sunilUser.id, actorRole: 'collector', selfAccepted: true } },
        { type: 'en_route', at: enRouteAt, meta: { actorId: sunilUser.id, actorRole: 'collector', previousStatus: 'assigned' } },
        { type: 'arriving', at: arrivingAt, meta: { actorId: sunilUser.id, actorRole: 'collector', previousStatus: 'en_route' } },
        { type: 'completed', at: completedAt, meta: { actorId: sunilUser.id, actorRole: 'collector', previousStatus: 'arriving', totalWeightKg, payoutInr } },
      ],
    );
    console.log(`  completed ${c.daysBack}d ago → ₹${payoutInr} (${totalWeightKg}kg)`);
  }

  // ── 3. Cancelled — Done tab must also show the muted/cancelled state ──
  {
    const addressId = await addressFor(CUST.RAJESH);
    const created = daysAgo(4);
    const cancelledAt = shift(created, 12 * H);
    await upsertOrder(
      OID.CANCELLED,
      {
        customerId: CUST.RAJESH,
        status: 'cancelled',
        scheduledAt: shift(created, 24 * H),
        addressId,
        collectorId: sunilId,
        notes: 'Customer found another buyer before pickup.',
        cancelledAt,
        createdAt: created,
      },
      [{ categoryId: id('Cardboard') }],
      [
        { type: 'created', at: created },
        { type: 'assigned', at: shift(created, 1 * H), meta: { actorId: sunilUser.id, actorRole: 'collector', selfAccepted: true } },
        { type: 'cancelled', at: cancelledAt, meta: { actorId: CUST.RAJESH, actorRole: 'customer' } },
      ],
    );
  }

  // ── 4. Unclaimed pool — richer "New" tab, including edge cases ──────────
  {
    // Today, single category — exercises "Today, H:MM" formatting.
    const addressId = await addressFor(CUST.DEEPA);
    const created = shift(NOW, -4 * H);
    await upsertOrder(
      OID.AVAIL_TODAY,
      {
        customerId: CUST.DEEPA,
        status: 'scheduled',
        scheduledAt: todayAt(19, 30),
        addressId,
        createdAt: created,
      },
      [{ categoryId: id('Newspaper') }],
      [{ type: 'created', at: created }],
    );
  }
  {
    // Tomorrow, 3 categories + a note — exercises the multi-line notes + chip wrap.
    const addressId = await addressFor(CUST.VIKRAM);
    const created = shift(NOW, -6 * H);
    await upsertOrder(
      OID.AVAIL_MULTI,
      {
        customerId: CUST.VIKRAM,
        status: 'scheduled',
        scheduledAt: shift(daysAhead(1), 10 * H),
        addressId,
        notes: 'Please call 10 minutes before arriving — security gate downstairs.',
        createdAt: created,
      },
      [
        { categoryId: id('Iron / Steel') },
        { categoryId: id('Aluminium') },
        { categoryId: id('Copper Wire') },
      ],
      [{ type: 'created', at: created }],
    );
  }
  {
    // Edge case: booking with ZERO categories attached (invalid/incomplete
    // booking — mirrors the main seed's O-04 edge case). Exercises the
    // "no materials listed" empty state on the order-detail page and the
    // complete-pickup dialog's warning banner if a collector accepts it.
    const addressId = await addressFor(CUST.KAVITHA);
    const created = shift(NOW, -1 * H);
    await upsertOrder(
      OID.AVAIL_NO_CATS,
      {
        customerId: CUST.KAVITHA,
        status: 'scheduled',
        scheduledAt: shift(daysAhead(2), 9 * H),
        addressId,
        createdAt: created,
      },
      [],
      [{ type: 'created', at: created }],
    );
  }
  {
    // Far future — exercises the "day, short-month" date formatting branch.
    const addressId = await addressFor(CUST.LEELA);
    const created = shift(NOW, -8 * H);
    await upsertOrder(
      OID.AVAIL_FAR,
      {
        customerId: CUST.LEELA,
        status: 'scheduled',
        scheduledAt: shift(daysAhead(10), 11 * H),
        addressId,
        createdAt: created,
      },
      [{ categoryId: id('E-Waste') }],
      [{ type: 'created', at: created }],
    );
  }

  console.log('\n✅ Top-up complete.');
  console.log('   Sign in as collector@scrapit.app / Collector@123 to review:');
  console.log('   - Active tab: 1 assigned, 1 en_route, 1 arriving');
  console.log('   - Done tab: 9 completed (spread over 14 days) + 1 cancelled');
  console.log('   - New tab: 9 unclaimed orders incl. today / multi-category+note / zero-category edge case / far-future');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
