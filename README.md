# Scrap-it monorepo

Turborepo workspace for the Scrap-it logistics platform: **Expo mobile**, **Next.js admin**, **NestJS backend**, and shared TypeScript packages.

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io/) 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)

## Structure

| Path | Description |
|------|-------------|
| `apps/mobile` | React Native (Expo SDK 54) — product app |
| `apps/admin` | Next.js admin dashboard (Tailwind + shadcn/ui) |
| `apps/backend` | NestJS REST API, Prisma, Supabase JWT + Storage |
| `packages/types` | Shared API-facing TypeScript types |
| `packages/constants` | Shared enums/constants |
| `packages/api-client` | Typed fetch wrapper for clients |
| `packages/tsconfig` | Shared TS bases (Nest, Next, generic) |
| `packages/eslint-config` | Shared ESLint (Expo flat config) |

## Commands

```bash
pnpm install

# Dev (all apps that define `dev`)
pnpm dev

# Per app
pnpm --filter @scrap-it/mobile dev
pnpm --filter @scrap-it/admin dev
pnpm --filter @scrap-it/backend dev

# Build shared packages + backend + admin
pnpm build

# Lint
pnpm lint
```

## Environment

- Root [`.env.example`](./.env.example) lists variable names only.
- Copy per-app examples: `apps/mobile/.env.example`, `apps/admin/.env.example`, `apps/backend/.env.example`.
- **Never commit secrets.** Use Supabase dashboard for JWT secret, anon key, service role, and Postgres URLs.

## Database (backend)

Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) from Supabase, then from `apps/backend`:

```bash
pnpm prisma migrate deploy
```

Initial SQL lives under `apps/backend/prisma/migrations/`.

## Mobile + Supabase

The Expo app reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. The client is [`apps/mobile/src/lib/supabase.ts`](apps/mobile/src/lib/supabase.ts).

For product architecture notes, see [`apps/mobile/ARCHITECTURE.md`](apps/mobile/ARCHITECTURE.md).
