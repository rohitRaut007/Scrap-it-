/**
 * DESTRUCTIVE SEED — Scrap-it development / staging
 * ══════════════════════════════════════════════════
 * ⚠  WARNING — read before running against Supabase:
 *
 *   1. ALL PickupOrders are deleted (cascades: PickupTimeline,
 *      PickupOrderPhoto, PickupOrderCategory).
 *   2. ALL Users whose email ends in "@seed.scrap-it.test" are deleted
 *      (cascades: Address, Collector, Notification, IdempotencyRecord).
 *   3. ALL Categories are replaced with the seed set.
 *   4. Real admin accounts with other email domains are NOT touched.
 *
 * Safe to re-run: seed users carry fixed UUIDs so a second run wipes
 * and recreates them cleanly without leaving orphan rows.
 *
 * DO NOT run against a production instance with real customer data.
 * ══════════════════════════════════════════════════
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Time helpers ──────────────────────────────────────────────────────────────
const NOW = new Date();
const D   = 86_400_000;  // ms per day
const H   = 3_600_000;   // ms per hour
const MIN = 60_000;       // ms per minute

const daysAgo   = (n) => new Date(+NOW - n * D);
const daysAhead = (n) => new Date(+NOW + n * D);
const hrsAgo    = (n) => new Date(+NOW - n * H);
const minsAgo   = (n) => new Date(+NOW - n * MIN);
const shift     = (base, ms) => new Date(+base + ms);
const todayAt   = (h, m = 0) => { const d = new Date(NOW); d.setHours(h, m, 0, 0); return d; };

// ─── Categories ────────────────────────────────────────────────────────────────
const CATEGORY_DEFS = [
  { name: 'Newspaper',     rateLabel: '₹14–18/kg',   baseRateInr: 15,  iconKey: 'paper'       },
  { name: 'Cardboard',     rateLabel: '₹5–8/kg',     baseRateInr: 7,   iconKey: 'paper'       },
  { name: 'Iron / Steel',  rateLabel: '₹28–35/kg',   baseRateInr: 30,  iconKey: 'metal'       },
  { name: 'Copper Wire',   rateLabel: '₹380–420/kg', baseRateInr: 400, iconKey: 'metal'       },
  { name: 'Hard Plastic',  rateLabel: '₹8–12/kg',    baseRateInr: 10,  iconKey: 'plastic'     },
  { name: 'E-Waste',       rateLabel: '₹20–100/kg',  baseRateInr: 40,  iconKey: 'electronics' },
  { name: 'Aluminium',     rateLabel: '₹80–100/kg',  baseRateInr: 90,  iconKey: 'metal'       },
  { name: 'Glass Bottles', rateLabel: '₹2–5/kg',     baseRateInr: 3,   iconKey: 'glass'       },
];

// ─── Customer user IDs (fixed UUIDs for idempotency) ──────────────────────────
const C = {
  PRIYA:   '11111111-0000-4000-a000-000000000001',
  RAHUL:   '11111111-0000-4000-a000-000000000002',
  ANJALI:  '11111111-0000-4000-a000-000000000003',
  SURESH:  '11111111-0000-4000-a000-000000000004',
  MEENA:   '11111111-0000-4000-a000-000000000005',
  VIKRAM:  '11111111-0000-4000-a000-000000000006',
  DEEPA:   '11111111-0000-4000-a000-000000000007',
  ARJUN:   '11111111-0000-4000-a000-000000000008',
  SUNITA:  '11111111-0000-4000-a000-000000000009',
  RAJESH:  '11111111-0000-4000-a000-000000000010',
  LEELA:   '11111111-0000-4000-a000-000000000011',
  SANJAY:  '11111111-0000-4000-a000-000000000012',
  POOJA:   '11111111-0000-4000-a000-000000000013',
  MAHESH:  '11111111-0000-4000-a000-000000000014',
  KAVITHA: '11111111-0000-4000-a000-000000000015',
  AMIT:    '11111111-0000-4000-a000-000000000016',
  NEHA:    '11111111-0000-4000-a000-000000000017',
};

const CUSTOMERS = [
  { id: C.PRIYA,   name: 'Priya Sharma',    email: 'priya.sharma@seed.scrap-it.test',    phone: '+91 98230 01101' },
  { id: C.RAHUL,   name: 'Rahul Deshmukh',  email: 'rahul.deshmukh@seed.scrap-it.test',  phone: '+91 98230 01102' },
  { id: C.ANJALI,  name: 'Anjali Patil',    email: 'anjali.patil@seed.scrap-it.test',    phone: '+91 98230 01103' },
  { id: C.SURESH,  name: 'Suresh Iyer',     email: 'suresh.iyer@seed.scrap-it.test',     phone: '+91 98200 01104' },
  { id: C.MEENA,   name: 'Meena Kulkarni',  email: 'meena.kulkarni@seed.scrap-it.test',  phone: '+91 98230 01105' },
  { id: C.VIKRAM,  name: 'Vikram Nair',     email: 'vikram.nair@seed.scrap-it.test',     phone: '+91 98200 01106' },
  { id: C.DEEPA,   name: 'Deepa Joshi',     email: 'deepa.joshi@seed.scrap-it.test',     phone: '+91 98230 01107' },
  { id: C.ARJUN,   name: 'Arjun Mehta',     email: 'arjun.mehta@seed.scrap-it.test',     phone: '+91 98200 01108' },
  { id: C.SUNITA,  name: 'Sunita Pawar',    email: 'sunita.pawar@seed.scrap-it.test',    phone: '+91 98230 01109' },
  { id: C.RAJESH,  name: 'Rajesh Kadam',    email: 'rajesh.kadam@seed.scrap-it.test',    phone: '+91 98230 01110' },
  { id: C.LEELA,   name: 'Leela Rao',       email: 'leela.rao@seed.scrap-it.test',       phone: '+91 98200 01111' },
  { id: C.SANJAY,  name: 'Sanjay Bhosle',   email: 'sanjay.bhosle@seed.scrap-it.test',   phone: '+91 98230 01112' },
  { id: C.POOJA,   name: 'Pooja Tiwari',    email: 'pooja.tiwari@seed.scrap-it.test',    phone: '+91 98230 01113' },
  { id: C.MAHESH,  name: 'Mahesh Gupta',    email: 'mahesh.gupta@seed.scrap-it.test',    phone: '+91 98200 01114' },
  { id: C.KAVITHA, name: 'Kavitha Murthy',  email: 'kavitha.murthy@seed.scrap-it.test',  phone: '+91 71220 01115' },
  { id: C.AMIT,    name: 'Amit Sawant',     email: 'amit.sawant@seed.scrap-it.test',     phone: '+91 98230 01116' },
  { id: C.NEHA,    name: 'Neha Chavan',     email: 'neha.chavan@seed.scrap-it.test',     phone: '+91 98230 01117' },
];

// ─── Collector user IDs (fixed UUIDs) ─────────────────────────────────────────
const K = {
  SUNIL:  '22222222-0000-4000-a000-000000000001',
  RAVI:   '22222222-0000-4000-a000-000000000002',
  GANESH: '22222222-0000-4000-a000-000000000003',
  DILIP:  '22222222-0000-4000-a000-000000000004',
  ARUN:   '22222222-0000-4000-a000-000000000005',
  YOGESH: '22222222-0000-4000-a000-000000000006',
};

const COLLECTOR_DEFS = [
  { id: K.SUNIL,  name: 'Sunil Kamble',   email: 'sunil.kamble@seed.scrap-it.test',   phone: '+91 98230 02001', vehicleInfo: 'Tata Ace · MH-12 CB 4521',                     rating: 4.7, bookingSlug: 'sunil-kamble-pune',   serviceArea: 'Kothrud, Pune' },
  { id: K.RAVI,   name: 'Ravi Shinde',    email: 'ravi.shinde@seed.scrap-it.test',    phone: '+91 98230 02002', vehicleInfo: 'Hero Splendor + Cargo Trailer · MH-14 GZ 7890', rating: 3.5, bookingSlug: 'ravi-shinde-pune',    serviceArea: 'Deccan, Pune' },
  { id: K.GANESH, name: 'Ganesh Mane',    email: 'ganesh.mane@seed.scrap-it.test',    phone: '+91 98230 02003', vehicleInfo: 'Bajaj RE Auto · MH-12 PQ 3344',                  rating: 2.8, bookingSlug: 'ganesh-mane-pune',    serviceArea: 'Aundh, Pune' },
  { id: K.DILIP,  name: 'Dilip Waghmare', email: 'dilip.waghmare@seed.scrap-it.test', phone: '+91 98230 02004', vehicleInfo: 'Mahindra Bolero Pickup · MH-20 AB 1122',          rating: 4.2, bookingSlug: 'dilip-waghmare-pune', serviceArea: 'Hadapsar, Pune' },
  { id: K.ARUN,   name: 'Arun Parab',     email: 'arun.parab@seed.scrap-it.test',     phone: '+91 98200 02005', vehicleInfo: 'Tata Ace · MH-04 DC 9988',                      rating: 4.8, bookingSlug: 'arun-parab-mumbai',   serviceArea: 'Andheri West, Mumbai' },
  { id: K.YOGESH, name: 'Yogesh Thakur',  email: 'yogesh.thakur@seed.scrap-it.test',  phone: '+91 98230 02006', vehicleInfo: null, rating: null, bookingSlug: null, serviceArea: null }, // ⚠ EDGE: no vehicleInfo, no rating, no slug
];

// ─── Customer addresses ────────────────────────────────────────────────────────
const CUSTOMER_ADDRESSES = [
  { userId: C.PRIYA,   label: 'Home', line1: 'Flat 4B, Sai Residency, Lane 5',                city: 'Pune',    region: 'Maharashtra', postalCode: '411001', latitude: 18.5362, longitude: 73.8938 },
  { userId: C.RAHUL,   label: 'Home', line1: '23, Saraswati Vihar, Paud Road',                city: 'Pune',    region: 'Maharashtra', postalCode: '411038', latitude: 18.5074, longitude: 73.8146 },
  { userId: C.ANJALI,  label: 'Home', line1: 'A-201, Greenfield Apartments, Baner Road',      city: 'Pune',    region: 'Maharashtra', postalCode: '411045', latitude: 18.5590, longitude: 73.7869 },
  { userId: C.SURESH,  label: 'Home', line1: '302, Horizon Heights, DN Nagar',                city: 'Mumbai',  region: 'Maharashtra', postalCode: '400058', latitude: 19.1136, longitude: 72.8349 },
  { userId: C.MEENA,   label: 'Home', line1: '12, Shankar Niwas, Apte Road',                  city: 'Pune',    region: 'Maharashtra', postalCode: '411004', latitude: 18.5167, longitude: 73.8389 },
  { userId: C.VIKRAM,  label: 'Home', line1: '5th Floor, Seaview Complex, Linking Road',      city: 'Mumbai',  region: 'Maharashtra', postalCode: '400050', latitude: 19.0596, longitude: 72.8295 },
  { userId: C.DEEPA,   label: 'Home', line1: 'C-14, Nilgiri Heights, ITI Road',               city: 'Pune',    region: 'Maharashtra', postalCode: '411007', latitude: 18.5579, longitude: 73.8089 },
  { userId: C.ARJUN,   label: 'Home', line1: '8, Swastik CHS, Gokhale Road North',            city: 'Mumbai',  region: 'Maharashtra', postalCode: '400028', latitude: 19.0178, longitude: 72.8459 },
  { userId: C.SUNITA,  label: 'Home', line1: 'B-305, Pride Residency, Wakad-Hinjewadi Road',  city: 'Pune',    region: 'Maharashtra', postalCode: '411057', latitude: 18.5989, longitude: 73.7595 },
  { userId: C.RAJESH,  label: 'Home', line1: '101, Magarpatta Epoch, EOIZ Road',              city: 'Pune',    region: 'Maharashtra', postalCode: '411014', latitude: 18.5468, longitude: 73.9421 },
  { userId: C.LEELA,   label: 'Home', line1: '23B, Chandralok CHS, MG Road',                 city: 'Mumbai',  region: 'Maharashtra', postalCode: '400066', latitude: 19.2281, longitude: 72.8601 },
  { userId: C.SANJAY,  label: 'Home', line1: '7, Bhagwat Nagar, Fatimanagar Road',           city: 'Pune',    region: 'Maharashtra', postalCode: '411028', latitude: 18.4979, longitude: 73.9240 },
  { userId: C.POOJA,   label: 'Home', line1: 'D-12, Galaxy Garden, Airport Road',            city: 'Pune',    region: 'Maharashtra', postalCode: '411014', latitude: 18.5679, longitude: 73.9097 },
  { userId: C.MAHESH,  label: 'Home', line1: '4A, Siddhi Gardens, Pokhran Road No. 2',       city: 'Thane',   region: 'Maharashtra', postalCode: '400610', latitude: 19.2094, longitude: 72.9784 },
  { userId: C.KAVITHA, label: 'Home', line1: '56, Samarth Nagar, WHC Road',                  city: 'Nagpur',  region: 'Maharashtra', postalCode: '440010', latitude: 21.1354, longitude: 79.0743 },
  { userId: C.AMIT,    label: 'Home', line1: '302, Om Sai Heights, Dattanagar Road',         city: 'Pune',    region: 'Maharashtra', postalCode: '411027', latitude: 18.5987, longitude: 73.8013 },
  { userId: C.NEHA,    label: 'Home', line1: 'E-8, Orchid Palms, NIBM Road',                city: 'Pune',    region: 'Maharashtra', postalCode: '411048', latitude: 18.4670, longitude: 73.8906 },
];

const COLLECTOR_ADDRESSES = [
  { userId: K.SUNIL,  label: 'Home', line1: '14, Bhim Nagar, Yerwada',            city: 'Pune',   region: 'Maharashtra', postalCode: '411006' },
  { userId: K.RAVI,   label: 'Home', line1: '5, Kabir Colony, Dapodi',            city: 'Pune',   region: 'Maharashtra', postalCode: '411012' },
  { userId: K.GANESH, label: 'Home', line1: '8, Ramtekdi, Hadapsar',              city: 'Pune',   region: 'Maharashtra', postalCode: '411013' },
  { userId: K.DILIP,  label: 'Home', line1: '22, Chandan Nagar, Wagholi',         city: 'Pune',   region: 'Maharashtra', postalCode: '412207' },
  { userId: K.ARUN,   label: 'Home', line1: '3rd Floor, Ramabai Colony, Dharavi', city: 'Mumbai', region: 'Maharashtra', postalCode: '400017' },
  { userId: K.YOGESH, label: 'Home', line1: '9, Satara Road, Bibwewadi',          city: 'Pune',   region: 'Maharashtra', postalCode: '411037' },
];

// ─── Order helper ──────────────────────────────────────────────────────────────
//
// Timeline event types match what the real backend emits:
//   "created"  — on order creation (orders.service.ts)
//   "assigned" — on collector assignment (admin-orders.service.ts)
//   "en_route" | "arriving" | "completed" | "cancelled" — status transitions
//
async function createOrder(data, catIds, timelineEvents) {
  return prisma.pickupOrder.create({
    data: {
      customerId:    data.customerId,
      status:        data.status,
      scheduledAt:   data.scheduledAt,
      addressId:     data.addressId,
      collectorId:   data.collectorId ?? null,
      etaMinutes:    data.etaMinutes  ?? null,
      totalWeightKg: data.totalWeightKg ?? null,
      notes:         data.notes ?? null,
      // Completed orders are dated by their 'completed' timeline event.
      completedAt:   data.status === 'completed'
        ? (timelineEvents.find((e) => e.type === 'completed')?.at ?? null)
        : null,
      cancelledAt:   data.cancelledAt ?? null,
      createdAt:     data.createdAt,
      categories: {
        create: catIds.map((id) => ({ categoryId: id })),
      },
      timeline: {
        create: timelineEvents.map((e) => ({
          eventType:  e.type,
          occurredAt: e.at,
          metadata:   e.meta ?? null,
        })),
      },
    },
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n⚠  Scrap-it DESTRUCTIVE SEED starting…\n');

  // ── 1. Teardown ──────────────────────────────────────────────────────────────

  // Break the circular FK: User.defaultAddressId → Address (SET NULL on delete,
  // but Postgres can get confused when both sides are deleted in the same txn).
  await prisma.user.updateMany({
    where: { email: { endsWith: '@seed.scrap-it.test' } },
    data: { defaultAddressId: null },
  });

  // Orders must go first — PickupOrder.collectorId has no onDelete specified,
  // which means Postgres defaults to NO ACTION (restrict). Deleting Collectors
  // while live orders reference them would fail.
  const { count: ordersDeleted } = await prisma.pickupOrder.deleteMany({});
  console.log(`   [teardown] deleted ${ordersDeleted} pickup orders (+ cascaded timeline/photos/categories)`);

  const { count: usersDeleted } = await prisma.user.deleteMany({
    where: { email: { endsWith: '@seed.scrap-it.test' } },
  });
  console.log(`   [teardown] deleted ${usersDeleted} seed users (+ cascaded addresses/collectors/notifications)`);

  await prisma.category.deleteMany({});
  console.log('   [teardown] cleared categories');

  // ── 2. Categories ─────────────────────────────────────────────────────────────
  const catRows = [];
  for (const def of CATEGORY_DEFS) {
    catRows.push(await prisma.category.create({ data: { ...def, active: true } }));
  }
  const cat = Object.fromEntries(catRows.map((c) => [c.name, c.id]));
  console.log(`\n   [seed] ${catRows.length} categories`);

  // ── 3. Customers + addresses ───────────────────────────────────────────────────
  await prisma.user.createMany({
    data: CUSTOMERS.map((c) => ({ ...c, role: 'customer' })),
    skipDuplicates: true,
  });

  const addrMap = {}; // userId → addressId
  for (const addr of CUSTOMER_ADDRESSES) {
    const row = await prisma.address.create({ data: { ...addr, country: 'IN' } });
    addrMap[addr.userId] = row.id;
    await prisma.user.update({ where: { id: addr.userId }, data: { defaultAddressId: row.id } });
  }
  console.log(`   [seed] ${CUSTOMERS.length} customers`);

  // ── 4. Collectors + addresses ──────────────────────────────────────────────────
  await prisma.user.createMany({
    data: COLLECTOR_DEFS.map((c) => ({
      id: c.id, name: c.name, email: c.email, phone: c.phone, role: 'collector',
    })),
    skipDuplicates: true,
  });

  for (const addr of COLLECTOR_ADDRESSES) {
    await prisma.address.create({ data: { ...addr, country: 'IN' } });
  }

  const colMap = {}; // collectorUserId → Collector.id (auto-generated UUID)
  for (const def of COLLECTOR_DEFS) {
    const row = await prisma.collector.create({
      data: { userId: def.id, vehicleInfo: def.vehicleInfo, rating: def.rating, bookingSlug: def.bookingSlug, serviceArea: def.serviceArea },
    });
    colMap[def.id] = row.id;
  }
  // Shorthand aliases for order definitions below
  const col = {
    sunil:  colMap[K.SUNIL],
    ravi:   colMap[K.RAVI],
    ganesh: colMap[K.GANESH],
    dilip:  colMap[K.DILIP],
    arun:   colMap[K.ARUN],
    yogesh: colMap[K.YOGESH],
  };
  console.log(`   [seed] ${COLLECTOR_DEFS.length} collectors`);

  // ── 5. Orders ──────────────────────────────────────────────────────────────────
  //
  // Legend: ⚠ = intentional edge case
  //
  // STATUS DISTRIBUTION:
  //   scheduled : 6  (incl. 1 overdue, 1 due today, 1 zero-categories)
  //   assigned  : 5  (incl. 1 to no-vehicleInfo collector)
  //   en_route  : 3
  //   arriving  : 2
  //   completed : 10
  //   cancelled : 4
  //               ──
  //   TOTAL     : 30

  const orders = [];

  // ── SCHEDULED (6) ─────────────────────────────────────────────────────────────

  // O-01 · Normal, scheduled for later today
  orders.push(await createOrder(
    { customerId: C.PRIYA, status: 'scheduled',
      scheduledAt: todayAt(14, 0), createdAt: hrsAgo(20),
      addressId: addrMap[C.PRIYA], notes: null },
    [cat['Newspaper'], cat['Cardboard']],
    [{ type: 'created', at: hrsAgo(20), meta: { actorId: C.PRIYA, actorRole: 'customer' } }],
  ));

  // O-02 · Scheduled for tomorrow
  orders.push(await createOrder(
    { customerId: C.RAHUL, status: 'scheduled',
      scheduledAt: daysAhead(1), createdAt: hrsAgo(3),
      addressId: addrMap[C.RAHUL], notes: 'Please call before arriving' },
    [cat['Iron / Steel'], cat['Copper Wire']],
    [{ type: 'created', at: hrsAgo(3), meta: { actorId: C.RAHUL, actorRole: 'customer' } }],
  ));

  // O-03 · ⚠ EDGE: Stuck / overdue — scheduled 4 days ago, never assigned
  orders.push(await createOrder(
    { customerId: C.ANJALI, status: 'scheduled',
      scheduledAt: daysAgo(4), createdAt: daysAgo(5),
      addressId: addrMap[C.ANJALI],
      notes: 'Tried calling but no pickup happened — please follow up' },
    [cat['Hard Plastic'], cat['E-Waste']],
    [{ type: 'created', at: daysAgo(5), meta: { actorId: C.ANJALI, actorRole: 'customer' } }],
  ));

  // O-04 · ⚠ EDGE: Zero categories attached
  orders.push(await createOrder(
    { customerId: C.DEEPA, status: 'scheduled',
      scheduledAt: daysAhead(3), createdAt: hrsAgo(5),
      addressId: addrMap[C.DEEPA],
      notes: 'Will sort and weigh items before the collector arrives' },
    [], // intentionally empty
    [{ type: 'created', at: hrsAgo(5), meta: { actorId: C.DEEPA, actorRole: 'customer' } }],
  ));

  // O-05 · Scheduled for today, placed 30 min ago
  orders.push(await createOrder(
    { customerId: C.MEENA, status: 'scheduled',
      scheduledAt: todayAt(16, 30), createdAt: minsAgo(30),
      addressId: addrMap[C.MEENA], notes: null },
    [cat['Newspaper']],
    [{ type: 'created', at: minsAgo(30), meta: { actorId: C.MEENA, actorRole: 'customer' } }],
  ));

  // O-06 · Scheduled for tomorrow, large quantity note
  orders.push(await createOrder(
    { customerId: C.SUNITA, status: 'scheduled',
      scheduledAt: daysAhead(1), createdAt: hrsAgo(5),
      addressId: addrMap[C.SUNITA], notes: 'Large quantity — approx 30 kg, need bigger vehicle' },
    [cat['Aluminium'], cat['Iron / Steel']],
    [{ type: 'created', at: hrsAgo(5), meta: { actorId: C.SUNITA, actorRole: 'customer' } }],
  ));

  // ── ASSIGNED (5) ──────────────────────────────────────────────────────────────
  const adminId = 'seed-admin';

  // O-07 · Suresh Iyer (Mumbai) → Arun Parab
  const o07created = daysAgo(1);
  orders.push(await createOrder(
    { customerId: C.SURESH, status: 'assigned',
      scheduledAt: daysAhead(1), createdAt: o07created,
      addressId: addrMap[C.SURESH], collectorId: col.arun },
    [cat['E-Waste'], cat['Copper Wire']],
    [
      { type: 'created',  at: o07created,              meta: { actorId: C.SURESH, actorRole: 'customer' } },
      { type: 'assigned', at: shift(o07created, 2 * H), meta: { actorId: adminId, actorRole: 'admin', collectorId: col.arun } },
    ],
  ));

  // O-08 · Vikram Nair (Mumbai) → Arun Parab
  const o08created = hrsAgo(18);
  orders.push(await createOrder(
    { customerId: C.VIKRAM, status: 'assigned',
      scheduledAt: daysAhead(2), createdAt: o08created,
      addressId: addrMap[C.VIKRAM], collectorId: col.arun },
    [cat['Newspaper'], cat['Cardboard'], cat['Hard Plastic']],
    [
      { type: 'created',  at: o08created,              meta: { actorId: C.VIKRAM, actorRole: 'customer' } },
      { type: 'assigned', at: shift(o08created, 4 * H), meta: { actorId: adminId, actorRole: 'admin', collectorId: col.arun } },
    ],
  ));

  // O-09 · Sanjay Bhosle → Dilip Waghmare
  const o09created = daysAgo(2);
  orders.push(await createOrder(
    { customerId: C.SANJAY, status: 'assigned',
      scheduledAt: daysAhead(1), createdAt: o09created,
      addressId: addrMap[C.SANJAY], collectorId: col.dilip,
      notes: 'Old gate grill and iron rods — approx 45 kg' },
    [cat['Iron / Steel']],
    [
      { type: 'created',  at: o09created,               meta: { actorId: C.SANJAY, actorRole: 'customer' } },
      { type: 'assigned', at: shift(o09created, 5 * H),  meta: { actorId: adminId, actorRole: 'admin', collectorId: col.dilip } },
    ],
  ));

  // O-10 · ⚠ EDGE: Pooja Tiwari → Yogesh Thakur (no vehicleInfo, no rating)
  const o10created = hrsAgo(12);
  orders.push(await createOrder(
    { customerId: C.POOJA, status: 'assigned',
      scheduledAt: daysAhead(1), createdAt: o10created,
      addressId: addrMap[C.POOJA], collectorId: col.yogesh },
    [cat['Newspaper'], cat['Cardboard']],
    [
      { type: 'created',  at: o10created,             meta: { actorId: C.POOJA, actorRole: 'customer' } },
      { type: 'assigned', at: shift(o10created, 2 * H), meta: { actorId: adminId, actorRole: 'admin', collectorId: col.yogesh } },
    ],
  ));

  // O-11 · Rajesh Kadam → Sunil Kamble
  const o11created = hrsAgo(6);
  orders.push(await createOrder(
    { customerId: C.RAJESH, status: 'assigned',
      scheduledAt: daysAhead(1), createdAt: o11created,
      addressId: addrMap[C.RAJESH], collectorId: col.sunil },
    [cat['Aluminium'], cat['Copper Wire']],
    [
      { type: 'created',  at: o11created,             meta: { actorId: C.RAJESH, actorRole: 'customer' } },
      { type: 'assigned', at: shift(o11created, 1 * H), meta: { actorId: adminId, actorRole: 'admin', collectorId: col.sunil } },
    ],
  ));

  // ── EN_ROUTE (3) ──────────────────────────────────────────────────────────────

  // O-12 · Leela Rao (Mumbai) → Arun Parab, ETA 25 min
  const o12created = daysAgo(2);
  const o12assigned = shift(o12created, 3 * H);
  orders.push(await createOrder(
    { customerId: C.LEELA, status: 'en_route',
      scheduledAt: todayAt(11, 0), createdAt: o12created,
      addressId: addrMap[C.LEELA], collectorId: col.arun, etaMinutes: 25 },
    [cat['E-Waste']],
    [
      { type: 'created',  at: o12created,   meta: { actorId: C.LEELA, actorRole: 'customer' } },
      { type: 'assigned', at: o12assigned,  meta: { actorId: adminId, actorRole: 'admin', collectorId: col.arun } },
      { type: 'en_route', at: hrsAgo(0.5),  meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'assigned' } },
    ],
  ));

  // O-13 · Mahesh Gupta (Thane) → Ravi Shinde, ETA 40 min
  const o13created = daysAgo(1);
  const o13assigned = shift(o13created, 4 * H);
  orders.push(await createOrder(
    { customerId: C.MAHESH, status: 'en_route',
      scheduledAt: todayAt(10, 30), createdAt: o13created,
      addressId: addrMap[C.MAHESH], collectorId: col.ravi, etaMinutes: 40 },
    [cat['Newspaper'], cat['Glass Bottles']],
    [
      { type: 'created',  at: o13created,   meta: { actorId: C.MAHESH, actorRole: 'customer' } },
      { type: 'assigned', at: o13assigned,  meta: { actorId: adminId, actorRole: 'admin', collectorId: col.ravi } },
      { type: 'en_route', at: hrsAgo(0.75), meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'assigned' } },
    ],
  ));

  // O-14 · Amit Sawant → Ganesh Mane, ETA 15 min
  const o14created = daysAgo(1);
  const o14assigned = shift(o14created, 6 * H);
  orders.push(await createOrder(
    { customerId: C.AMIT, status: 'en_route',
      scheduledAt: todayAt(12, 0), createdAt: o14created,
      addressId: addrMap[C.AMIT], collectorId: col.ganesh, etaMinutes: 15 },
    [cat['Hard Plastic'], cat['Cardboard']],
    [
      { type: 'created',  at: o14created,   meta: { actorId: C.AMIT, actorRole: 'customer' } },
      { type: 'assigned', at: o14assigned,  meta: { actorId: adminId, actorRole: 'admin', collectorId: col.ganesh } },
      { type: 'en_route', at: hrsAgo(0.25), meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'assigned' } },
    ],
  ));

  // ── ARRIVING (2) ──────────────────────────────────────────────────────────────

  // O-15 · Kavitha Murthy (Nagpur) → Dilip Waghmare, ETA 5 min
  const o15created = daysAgo(2);
  const o15assigned = shift(o15created, 3 * H);
  orders.push(await createOrder(
    { customerId: C.KAVITHA, status: 'arriving',
      scheduledAt: todayAt(9, 0), createdAt: o15created,
      addressId: addrMap[C.KAVITHA], collectorId: col.dilip, etaMinutes: 5 },
    [cat['Iron / Steel'], cat['Aluminium']],
    [
      { type: 'created',  at: o15created,   meta: { actorId: C.KAVITHA, actorRole: 'customer' } },
      { type: 'assigned', at: o15assigned,  meta: { actorId: adminId, actorRole: 'admin', collectorId: col.dilip } },
      { type: 'en_route', at: hrsAgo(1.5),  meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'assigned' } },
      { type: 'arriving', at: hrsAgo(0.1),  meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'en_route' } },
    ],
  ));

  // O-16 · Neha Chavan → Sunil Kamble, ETA 3 min
  const o16created = daysAgo(1);
  const o16assigned = shift(o16created, 2 * H);
  orders.push(await createOrder(
    { customerId: C.NEHA, status: 'arriving',
      scheduledAt: todayAt(10, 0), createdAt: o16created,
      addressId: addrMap[C.NEHA], collectorId: col.sunil, etaMinutes: 3,
      notes: 'Call when outside, main gate is locked' },
    [cat['E-Waste'], cat['Hard Plastic']],
    [
      { type: 'created',  at: o16created,   meta: { actorId: C.NEHA, actorRole: 'customer' } },
      { type: 'assigned', at: o16assigned,  meta: { actorId: adminId, actorRole: 'admin', collectorId: col.sunil } },
      { type: 'en_route', at: hrsAgo(2),    meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'assigned' } },
      { type: 'arriving', at: hrsAgo(0.05), meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'en_route' } },
    ],
  ));

  // ── COMPLETED (10) ────────────────────────────────────────────────────────────
  // Helper for completed lifecycle timestamps
  function completedTimeline(created, collectorId) {
    const assigned  = shift(created, 2 * H);
    const enRoute   = shift(assigned, 30 * 60000);
    const arriving  = shift(enRoute,  45 * 60000);
    const completed = shift(arriving, 20 * 60000);
    return [
      { type: 'created',   at: created,   meta: { actorRole: 'customer' } },
      { type: 'assigned',  at: assigned,  meta: { actorId: adminId, actorRole: 'admin', collectorId } },
      { type: 'en_route',  at: enRoute,   meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'assigned' } },
      { type: 'arriving',  at: arriving,  meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'en_route' } },
      { type: 'completed', at: completed, meta: { actorId: adminId, actorRole: 'admin', previousStatus: 'arriving' } },
    ];
  }

  // O-17 · Priya Sharma — second order, 10 days ago
  orders.push(await createOrder(
    { customerId: C.PRIYA, status: 'completed',
      scheduledAt: daysAgo(10), createdAt: daysAgo(12),
      addressId: addrMap[C.PRIYA], collectorId: col.sunil, totalWeightKg: 12.5 },
    [cat['Newspaper'], cat['Cardboard']],
    completedTimeline(daysAgo(12), col.sunil),
  ));

  // O-18 · Rahul Deshmukh — heavy metals
  orders.push(await createOrder(
    { customerId: C.RAHUL, status: 'completed',
      scheduledAt: daysAgo(7), createdAt: daysAgo(9),
      addressId: addrMap[C.RAHUL], collectorId: col.dilip, totalWeightKg: 45.2,
      notes: 'Old gate grill + scrap iron rods' },
    [cat['Iron / Steel'], cat['Copper Wire']],
    completedTimeline(daysAgo(9), col.dilip),
  ));

  // O-19 · Suresh Iyer — electronics
  orders.push(await createOrder(
    { customerId: C.SURESH, status: 'completed',
      scheduledAt: daysAgo(14), createdAt: daysAgo(15),
      addressId: addrMap[C.SURESH], collectorId: col.arun, totalWeightKg: 8.0 },
    [cat['E-Waste']],
    completedTimeline(daysAgo(15), col.arun),
  ));

  // O-20 · Anjali Patil — plastics
  orders.push(await createOrder(
    { customerId: C.ANJALI, status: 'completed',
      scheduledAt: daysAgo(6), createdAt: daysAgo(8),
      addressId: addrMap[C.ANJALI], collectorId: col.sunil, totalWeightKg: 22.0 },
    [cat['Hard Plastic']],
    completedTimeline(daysAgo(8), col.sunil),
  ));

  // O-21 · Meena Kulkarni — aluminium
  orders.push(await createOrder(
    { customerId: C.MEENA, status: 'completed',
      scheduledAt: daysAgo(20), createdAt: daysAgo(22),
      addressId: addrMap[C.MEENA], collectorId: col.ravi, totalWeightKg: 15.5 },
    [cat['Aluminium']],
    completedTimeline(daysAgo(22), col.ravi),
  ));

  // O-22 · Vikram Nair — paper + plastic
  orders.push(await createOrder(
    { customerId: C.VIKRAM, status: 'completed',
      scheduledAt: daysAgo(5), createdAt: daysAgo(7),
      addressId: addrMap[C.VIKRAM], collectorId: col.arun, totalWeightKg: 30.0 },
    [cat['Newspaper'], cat['Cardboard']],
    completedTimeline(daysAgo(7), col.arun),
  ));

  // O-23 · Deepa Joshi — glass + plastic
  orders.push(await createOrder(
    { customerId: C.DEEPA, status: 'completed',
      scheduledAt: daysAgo(18), createdAt: daysAgo(19),
      addressId: addrMap[C.DEEPA], collectorId: col.ganesh, totalWeightKg: 18.3,
      notes: 'Mixed household glass and plastic bottles' },
    [cat['Glass Bottles'], cat['Hard Plastic']],
    completedTimeline(daysAgo(19), col.ganesh),
  ));

  // O-24 · Arjun Mehta — heavy iron
  orders.push(await createOrder(
    { customerId: C.ARJUN, status: 'completed',
      scheduledAt: daysAgo(3), createdAt: daysAgo(4),
      addressId: addrMap[C.ARJUN], collectorId: col.dilip, totalWeightKg: 60.0,
      notes: 'Dismantled bed frame + old machinery parts' },
    [cat['Iron / Steel']],
    completedTimeline(daysAgo(4), col.dilip),
  ));

  // O-25 · Sunita Pawar — e-waste + aluminium
  orders.push(await createOrder(
    { customerId: C.SUNITA, status: 'completed',
      scheduledAt: daysAgo(11), createdAt: daysAgo(13),
      addressId: addrMap[C.SUNITA], collectorId: col.sunil, totalWeightKg: 9.2 },
    [cat['E-Waste'], cat['Aluminium']],
    completedTimeline(daysAgo(13), col.sunil),
  ));

  // O-26 · Rajesh Kadam — newspaper only, quick pickup
  orders.push(await createOrder(
    { customerId: C.RAJESH, status: 'completed',
      scheduledAt: daysAgo(25), createdAt: daysAgo(26),
      addressId: addrMap[C.RAJESH], collectorId: col.ravi, totalWeightKg: 7.5 },
    [cat['Newspaper']],
    completedTimeline(daysAgo(26), col.ravi),
  ));

  // ── CANCELLED (4) ─────────────────────────────────────────────────────────────

  // O-27 · Arjun Mehta — cancelled from scheduled (customer unavailable)
  const o27created = daysAgo(3);
  orders.push(await createOrder(
    { customerId: C.ARJUN, status: 'cancelled',
      scheduledAt: daysAgo(2), createdAt: o27created,
      addressId: addrMap[C.ARJUN],
      cancelledAt: shift(o27created, 18 * H),
      notes: null },
    [cat['Iron / Steel'], cat['Aluminium']],
    [
      { type: 'created',   at: o27created,              meta: { actorId: C.ARJUN, actorRole: 'customer' } },
      { type: 'cancelled', at: shift(o27created, 18 * H), meta: { actorId: C.ARJUN, actorRole: 'customer', reason: 'Not available that day' } },
    ],
  ));

  // O-28 · Leela Rao — cancelled from assigned (changed her mind)
  const o28created = daysAgo(6);
  const o28assigned = shift(o28created, 3 * H);
  orders.push(await createOrder(
    { customerId: C.LEELA, status: 'cancelled',
      scheduledAt: daysAgo(5), createdAt: o28created,
      addressId: addrMap[C.LEELA], collectorId: col.arun,
      cancelledAt: shift(o28assigned, 5 * H) },
    [cat['Newspaper'], cat['Cardboard']],
    [
      { type: 'created',   at: o28created,              meta: { actorId: C.LEELA, actorRole: 'customer' } },
      { type: 'assigned',  at: o28assigned,             meta: { actorId: adminId, actorRole: 'admin', collectorId: col.arun } },
      { type: 'cancelled', at: shift(o28assigned, 5 * H), meta: { actorId: C.LEELA, actorRole: 'customer', reason: 'Items already disposed' } },
    ],
  ));

  // O-29 · Amit Sawant — cancelled quickly after scheduling (duplicate request)
  const o29created = daysAgo(8);
  orders.push(await createOrder(
    { customerId: C.AMIT, status: 'cancelled',
      scheduledAt: daysAgo(7), createdAt: o29created,
      addressId: addrMap[C.AMIT],
      cancelledAt: shift(o29created, 30 * 60000) },
    [cat['Hard Plastic']],
    [
      { type: 'created',   at: o29created,              meta: { actorId: C.AMIT, actorRole: 'customer' } },
      { type: 'cancelled', at: shift(o29created, 30 * 60000), meta: { actorId: C.AMIT, actorRole: 'customer', reason: 'Accidental duplicate booking' } },
    ],
  ));

  // O-30 · Kavitha Murthy — cancelled, admin override
  const o30created = daysAgo(15);
  const o30assigned = shift(o30created, 4 * H);
  orders.push(await createOrder(
    { customerId: C.KAVITHA, status: 'cancelled',
      scheduledAt: daysAgo(14), createdAt: o30created,
      addressId: addrMap[C.KAVITHA], collectorId: col.dilip,
      cancelledAt: shift(o30assigned, 2 * H) },
    [cat['Copper Wire'], cat['Aluminium']],
    [
      { type: 'created',   at: o30created,             meta: { actorId: C.KAVITHA, actorRole: 'customer' } },
      { type: 'assigned',  at: o30assigned,            meta: { actorId: adminId, actorRole: 'admin', collectorId: col.dilip } },
      { type: 'cancelled', at: shift(o30assigned, 2 * H), meta: { actorId: adminId, actorRole: 'admin', reason: 'Collector unavailable — no replacement in Nagpur' } },
    ],
  ));

  console.log(`   [seed] ${orders.length} pickup orders`);

  // ── 6. Notifications ──────────────────────────────────────────────────────────
  const notifications = [
    // Completed — read
    { userId: C.PRIYA,   title: 'Pickup complete!',     body: 'Your scrap pickup is done. Collected 12.5 kg.',        readAt: daysAgo(10) },
    { userId: C.RAHUL,   title: 'Pickup complete!',     body: 'Great! 45.2 kg of iron and copper collected.',         readAt: daysAgo(7)  },
    { userId: C.SURESH,  title: 'Pickup complete!',     body: 'E-waste pickup done. 8.0 kg collected.',               readAt: daysAgo(14) },
    { userId: C.MEENA,   title: 'Collector assigned',   body: 'Ravi Shinde will pick up your scrap.',                 readAt: daysAgo(22) },
    { userId: C.VIKRAM,  title: 'Pickup complete!',     body: 'Your 30 kg paper pickup is complete.',                 readAt: daysAgo(5)  },
    // Unread — various states
    { userId: C.ANJALI,  title: 'Pickup rescheduling needed', body: 'Your order from 4 days ago was not picked up. Our team is reviewing.', readAt: null },
    { userId: C.POOJA,   title: 'Collector assigned',   body: 'Yogesh Thakur has been assigned for your pickup.',     readAt: null },
    { userId: C.RAJESH,  title: 'Collector assigned',   body: 'Sunil Kamble will pick up your scrap tomorrow.',       readAt: null },
    { userId: C.LEELA,   title: 'Collector is on the way', body: 'Arun Parab is heading to your location. ETA: 25 min.', readAt: null },
    { userId: C.NEHA,    title: 'Collector is arriving', body: 'Sunil Kamble is arriving now — please be ready!',     readAt: null },
    { userId: C.KAVITHA, title: 'Collector is arriving', body: 'Dilip Waghmare is almost there. ETA: 5 min.',         readAt: null },
    { userId: C.MAHESH,  title: 'Collector is on the way', body: 'Ravi Shinde is heading to your location. ETA: 40 min.', readAt: null },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: { ...n, channel: 'in_app' },
    });
  }
  console.log(`   [seed] ${notifications.length} notifications`);

  // ── Summary ───────────────────────────────────────────────────────────────────
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1; return acc;
  }, {});

  console.log('\n✅ Seed complete');
  console.log(`   Categories : ${catRows.length}`);
  console.log(`   Customers  : ${CUSTOMERS.length} (17)`);
  console.log(`   Collectors : ${COLLECTOR_DEFS.length} (6)`);
  console.log(`   Orders     : ${orders.length} total`);
  Object.entries(statusCounts).forEach(([s, n]) =>
    console.log(`     ${s.padEnd(12)} ${n}`),
  );
  console.log(`   ⚠  Edge cases:`);
  console.log(`     O-03  stuck/overdue — scheduled 4 days ago, still SCHEDULED`);
  console.log(`     O-04  zero categories attached`);
  console.log(`     O-10  assigned to Yogesh Thakur (no vehicleInfo, no rating)`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
