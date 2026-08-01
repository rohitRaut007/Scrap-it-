/**
 * ONE-OFF PROVISIONING — real collector onboarding
 * ══════════════════════════════════════════════════
 * Creates the Supabase Auth user + Prisma User/Address/Collector rows for
 * a real collector (not a synthetic seed persona). Idempotent: safe to
 * re-run — looks up by email first and updates in place.
 *
 * Collector: Prashant Piraji Thorat — Baner, Pune, Maharashtra
 * Login: piraji@collector.app / Piraji@123
 * ══════════════════════════════════════════════════
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Cap the pool to 1 connection — this is a one-off script running alongside
// the backend dev server, which already saturates the session-mode pooler's
// small pool_size (see the Prisma-pooling note in project memory).
const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.searchParams.set('connection_limit', '1');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl.toString() } } });

const EMAIL = 'piraji@collector.app';
const PASSWORD = 'Piraji@123';
const NAME = 'Prashant Piraji Thorat';
const PHONE = '+91 72489 94290';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from environment');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 1. Supabase Auth user ────────────────────────────────────────────────
  let authUserId;
  const { data: existingPage, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = existingPage.users.find((u) => u.email === EMAIL);

  if (existing) {
    authUserId = existing.id;
    const { error: updateErr } = await supabase.auth.admin.updateUserById(authUserId, {
      password: PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'collector' },
      user_metadata: { name: NAME },
    });
    if (updateErr) throw updateErr;
    console.log(`[auth] updated existing Supabase user ${authUserId}`);
  } else {
    const { data, error: createErr } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'collector' },
      user_metadata: { name: NAME },
    });
    if (createErr) throw createErr;
    authUserId = data.user.id;
    console.log(`[auth] created Supabase user ${authUserId}`);
  }

  // ── 2. Prisma User row (id must match Supabase auth user id — see
  //      SupabaseJwtStrategy.validate, which upserts on payload.sub) ───────
  await prisma.user.upsert({
    where: { id: authUserId },
    update: { email: EMAIL, name: NAME, phone: PHONE, role: 'collector' },
    create: { id: authUserId, email: EMAIL, name: NAME, phone: PHONE, role: 'collector' },
  });
  console.log('[db] user row ready');

  // ── 3. Address ────────────────────────────────────────────────────────────
  let address = await prisma.address.findFirst({ where: { userId: authUserId } });
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: authUserId,
        label: 'Home',
        line1: 'Baner',
        city: 'Pune',
        region: 'Maharashtra',
        country: 'IN',
      },
    });
    await prisma.user.update({ where: { id: authUserId }, data: { defaultAddressId: address.id } });
  }
  console.log('[db] address row ready');

  // ── 4. Collector profile ─────────────────────────────────────────────────
  const collector = await prisma.collector.upsert({
    where: { userId: authUserId },
    update: { serviceArea: 'Baner, Pune' },
    create: { userId: authUserId, serviceArea: 'Baner, Pune' },
  });
  console.log(`[db] collector row ready (${collector.id})`);

  console.log('\n✅ Provisioned Prashant Piraji Thorat');
  console.log(`   Login: ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  })
  .then(async () => {
    await prisma.$disconnect();
  });
