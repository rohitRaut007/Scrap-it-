# Scrap-it monorepo — folder by folder

**Root:** `C:\r2\Scrap-it\` (or your clone path)

This is a **pnpm workspace** + **Turborepo** monorepo. The root contains very little application code — it defines how apps and packages connect.

---

## Root (`Scrap-it/`)

| File / folder | Purpose |
|---------------|---------|
| `pnpm-workspace.yaml` | Tells pnpm that all packages live under `apps/*` and `packages/*`. This is what makes `@scrap-it/types: workspace:*` resolve correctly. |
| `turbo.json` | Turborepo build pipeline — how `pnpm dev` / `pnpm build` / `pnpm lint` run across workspaces (caching, dependency ordering). |
| `package.json` | Root scripts (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`) and dev-only deps (Prettier, Turbo, TypeScript). |
| `pnpm-lock.yaml` | Lockfile — pinned versions for the entire monorepo. |
| `README.md` | Quick-start for the whole repo. |
| `.env.example` | Env var names (no values) that exist across apps — mostly documentation. |
| `node_modules/` | Hoisted shared dependencies (pnpm hoists here; per-package `node_modules` symlink in). |
| `dist-web/` | Build output (e.g. web build artifact — possibly Expo Web or admin output). |
| `apps/` | The four runnable applications (mobile, backend, admin, collector). |
| `packages/` | Shared libraries used by the apps. |
| `.vscode/` | Workspace VS Code settings. |

---

## `apps/mobile/` — Expo (React Native) customer app

The product the end-user uses.

### Top-level

| Folder / file | Purpose |
|---------------|---------|
| `src/` | All TypeScript source (detailed below). |
| `assets/` | Static images, icons, splash — bundled into the app. |
| `assets/images/` | Images referenced by code or `app.json`. |
| `android/` | Native Android project (Expo prebuild). Edit by hand only for Gradle, `AndroidManifest`, etc. `.gradle/`, `.kotlin/`, `build/` inside are caches. |
| `scripts/` | Custom Node scripts (codegen, asset preprocessing). |
| `app.json` | Expo config: name, icon, splash, plugins, permissions, scheme — app metadata. |
| `babel.config.js` | Babel — NativeWind + Expo Router preset. |
| `metro.config.js` | Metro — monorepo tweaks so `@scrap-it/*` resolves. |
| `tailwind.config.js` | NativeWind / Tailwind theme (colors, fonts, spacing). |
| `tsconfig.json` | TypeScript — extends shared `@scrap-it/tsconfig`. |
| `.env` / `.env.example` | Public env; anything Expo loads in JS must be `EXPO_PUBLIC_*`. |
| `ARCHITECTURE.md` | Feature-first folder convention — worth reading. |

### `apps/mobile/src/` — application code

| Folder | What lives here | Mental model |
|--------|-----------------|----------------|
| `app/` | Routes (Expo Router filesystem routing). | *What URL/screen exists.* |
| `features/` | Screen implementations + feature logic. | *What each screen does.* |
| `components/` | Generic UI primitives reused across features. | *Button, Card, Text.* |
| `api/` | Data-access — types & repositories. | *How we fetch & shape data.* |
| `services/` | Facades over repositories for the UI. | *Domain operations from UI.* |
| `lib/` | App-wide utilities & singletons (Supabase, theme, helpers). | *Cross-cutting plumbing.* |
| `mock/` | Seed data for local dev. | *Fake data for repositories.* |
| `types/` | App-local TS types not exported elsewhere. | *Shapes only mobile uses.* |
| `global.css` | Tailwind `@tailwind` entry for NativeWind. | *CSS root.* |

### `src/app/` — Expo Router routes

Filesystem = navigation. Folders in parentheses are **route groups** (organize without changing the URL).

```text
app/
├── _layout.tsx            # root navigator (theme, fonts, status bar)
├── index.tsx              # splash + initial routing
├── (auth)/                # pre-login
│   ├── _layout.tsx
│   ├── onboarding.tsx
│   └── login.tsx
└── (app)/                 # post-login
    ├── _layout.tsx
    ├── (tabs)/            # bottom tabs
    │   ├── _layout.tsx
    │   ├── home.tsx
    │   ├── map.tsx
    │   ├── orders.tsx
    │   └── profile.tsx
    ├── pickup/index.tsx   # pickup-flow modal
    └── order/[id].tsx     # order detail (dynamic param)
```

Route files stay thin: import the screen from `features/` and render. Routing stays separate from screen logic.

### `src/features/`

Each subfolder is one feature (screen, hooks, state, helpers).

| Folder | Feature |
|--------|---------|
| `auth/` | Login + sign-up. |
| `onboarding/` | First-launch slideshow. |
| `home/` | Home tab — greeting, address, categories, active pickup card. |
| `map/` | Map tab — most decomposed feature (see below). |
| `orders/` | Order list + history. |
| `pickup/` | Multi-step pickup wizard. |
| `profile/` | Profile / settings / logout. |

#### `features/map/` — richer feature shape

| Subfolder | Purpose |
|-----------|---------|
| `ui/` | Presentational RN components for the map. |
| `state/` | Local state (reducers / hooks). |
| `service/` | Map-specific logic (routes, ETA). |
| `telemetry/` | Logging / analytics for map interactions. |

Other features are still flatter (`*-screen.tsx`); they can grow the same structure as logic accumulates.

### `src/components/`

| Folder | Purpose |
|--------|---------|
| `ui/` | Primitives — `Button`, `Card`, `Text`, `Screen` (shadcn-style, RN). |
| `layout/` | Page shells (e.g. `Screen` wrapper). Dumb: props in, pixels out. |

### `src/api/` — data access

| File / folder | Purpose |
|---------------|---------|
| `types.ts` | `HttpMethod`, `ApiError`, request/response shapes — transport contract. |
| `repositories/` | One file per entity (`orders`, `categories`, …). In-memory mocks today; swap to HTTP via `api.ts` later. |

### `src/services/`

Thin domain facades the UI calls; they wrap repositories:

`analyticsService`, `authService`, `categoryService`, `orderService`, `pickupService`, `userService`

Example: `pickupService.create(…)` → repository `insert(…)`. Today in-memory; later real HTTP — screens stay the same.

### `src/lib/` — cross-cutting

| File | Purpose |
|------|---------|
| `supabase.ts` | Single Supabase client (auth + storage). |
| `api.ts` | HTTP client — attaches Supabase JWT, uses `EXPO_PUBLIC_API_BASE_URL`. |
| `theme.tsx` | Light/dark context, persisted to AsyncStorage. |
| `cn.ts` | `clsx` + `tailwind-merge` for classNames. |
| `delay.ts` | `await delay(ms)` for mocks. |
| `storage-keys.ts` | AsyncStorage key constants. |

---

## `apps/backend/` — NestJS REST API

Server: Supabase Postgres via Prisma; validates Supabase JWTs.

### Top-level

| Folder / file | Purpose |
|---------------|---------|
| `src/` | TypeScript source (below). |
| `prisma/` | Schema + migrations. |
| `prisma/schema.prisma` | Data model — single source of truth for the DB. |
| `prisma/migrations/` | Versioned SQL (e.g. `20260109000000_init`). |
| `nest-cli.json` | Nest CLI — build / start. |
| `tsconfig.json` / `tsconfig.build.json` | TS; build excludes tests. |
| `eslint.config.mjs` | Extends `@scrap-it/eslint-config`. |
| `.env` / `.env.example` | Server secrets — JWT secret, DB URLs, service role, etc. |

### `apps/backend/src/`

```text
src/
├── main.ts             # bootstrap: Nest, validation pipe, CORS, listen
├── app.module.ts       # root module
├── app.controller.ts   # /health
├── config/             # typed env loader
├── common/             # shared Nest building blocks
├── database/           # Prisma module + service
└── modules/            # one folder per domain feature
```

### `src/common/` — Nest “stdlib”

| Folder | Purpose |
|--------|---------|
| `decorators/` | e.g. `@CurrentUser()`, `@Roles('admin')`. |
| `dto/` | Shared DTOs (e.g. pagination). |
| `filters/` | e.g. uniform `HttpExceptionFilter`. |
| `guards/` | e.g. `RolesGuard` for `@Roles(...)`. |
| `interceptors/` | e.g. `LoggingInterceptor`. |

### `src/config/`

Typed `configuration()` from `process.env`, registered with `ConfigModule.forRoot({ load: [configuration] })` — use `config.get('supabase.url')` instead of raw `process.env`.

### `src/database/`

| File | Purpose |
|------|---------|
| `prisma.module.ts` | `@Global()` module exporting `PrismaService`. |
| `prisma.service.ts` | Extends `PrismaClient`; connect on init, disconnect on shutdown. |

### `src/modules/` — domain modules

Nest pattern: `<name>.module.ts` + `<name>.controller.ts` (+ services, DTOs as needed).

| Module | Purpose | State |
|--------|---------|--------|
| `auth/` | Supabase JWT validation; strategy + guards; auto-upserts `User`. | Implemented |
| `users/` | User CRUD. | Stub |
| `pickups/` | Create / list / cancel pickups. | Stub |
| `orders/` | Status, lifecycle. | Stub |
| `collectors/` | Collector portal API (`@Roles('collector')`): profile + booking slug, available-orders feed, accept/decline, status updates, weigh-and-complete with payout calculation, earnings summary/series. | Implemented |
| `categories/` | Waste categories + pricing. | Stub |
| `notifications/` | In-app / email / SMS / push. | Stub |
| `analytics/` | Reports, KPIs. | Stub |
| `admin/` | Role-gated admin (`@Roles('admin')`). | Stub |
| `uploads/` | Supabase Storage signed URLs. | Implemented |

#### `auth/` internals

| Path | Purpose |
|------|---------|
| `strategies/supabase-jwt.strategy.ts` | passport-jwt with `SUPABASE_JWT_SECRET`. |
| `guards/` | `JwtAuthGuard` for `@UseGuards()` on protected routes. |

---

## `apps/admin/` — Next.js admin dashboard

Operations dashboard: order list/detail, collector assignment, status updates, stats. Admin-role gated (Supabase JWT `app_metadata.role`).

| Folder / file | Purpose |
|---------------|---------|
| `src/app/` | App Router — today `layout.tsx` + placeholder `page.tsx`. |
| `src/lib/` | Utilities (`cn`, etc.). Eventually Supabase + API helper. |
| `public/` | Static assets at `/`. |
| `next.config.ts` | Next config — add workspace transpile for `@scrap-it/*` when used. |
| `components.json` | shadcn/ui (`new-york`, lucide). |
| `tailwind.config.ts` | Tailwind for the dashboard. |
| `postcss.config.mjs` | PostCSS for Tailwind. |
| `tsconfig.json` | TypeScript. |
| `eslint.config.mjs` | Lint. |
| `.env.example` | Admin env template. |

---

## `apps/collector/` — Next.js collector portal

Mobile-first web portal for collectors (kabadiwalas), gated to `role=collector`. Runs on port **3004** (`pnpm --filter @scrap-it/collector dev`).

| Route | Purpose |
|-------|---------|
| `/login` | Collector sign-in (Supabase password auth + role check). |
| `/dashboard` | Today's earnings hero, week/month stats, next pickup, available-orders banner. |
| `/orders` | Segmented feed — New (claimable) / Active / Done — with one-tap Accept. |
| `/orders/[id]` | Detail: status stepper, customer card (call/WhatsApp), Google Maps link, materials with rates, weigh-and-complete dialog that computes the customer payout live. |
| `/earnings` | Today/week/month totals, 14-day bar chart, lifetime stats, recent pickups. |
| `/profile` | Editable details + personal booking QR code (`scrapit.app/book/<slug>`) with copy/share. |

Structure mirrors `apps/admin` (App Router, Tailwind v4, shadcn/ui, SWR, same brand tokens in `globals.css`). API calls hit the `/collectors/me/*` backend endpoints via `src/lib/api.ts`.

---

## `packages/` — shared libraries

Consumed via `"@scrap-it/foo": "workspace:*"` in app `package.json`. pnpm symlinks — edits propagate without a separate publish step.

| Package | Exports | Consumed by |
|---------|---------|-------------|
| `packages/types/` | Shared TS types & enums — `UserRole`, `OrderStatus`, `ApiEnvelope<T>`, `Paginated<T>`, etc. | backend, mobile, admin |
| `packages/constants/` | Runtime values mirroring types. | backend, mobile, admin |
| `packages/api-client/` | `createApiClient({ baseUrl, getToken })` — typed fetch. Declared; mobile still uses `lib/api.ts` for now; unify later. | admin (declared); mobile eventually |
| `packages/tsconfig/` | Shared `tsconfig.base.json` variants (Nest, Next, generic). | every app |
| `packages/eslint-config/` | Shared ESLint flat config. | every app |

Typical package layout:

```text
packages/<name>/
├── package.json    # name, exports, peers
├── tsconfig.json   # extends @scrap-it/tsconfig
└── src/
    └── index.ts    # public API
```

---

## “Where does X live?” cheat sheet

| If you want to… | Go to… |
|-----------------|--------|
| Add a new mobile screen | `apps/mobile/src/features/<name>/` + a route under `apps/mobile/src/app/` |
| Add a new backend endpoint | `apps/backend/src/modules/<name>/` (controller + service) |
| Change DB schema | `apps/backend/prisma/schema.prisma`, then `pnpm prisma migrate dev --name <thing>` |
| Add a shared wire type | `packages/types/src/index.ts` |
| Add a reusable RN UI primitive | `apps/mobile/src/components/ui/` |
| Add a Nest guard / decorator / interceptor | `apps/backend/src/common/<kind>/` |
| Add an admin page | `apps/admin/src/app/<route>/page.tsx` |
| Add a collector portal page | `apps/collector/src/app/(portal)/<route>/page.tsx` |
| Wire a mobile env var | `apps/mobile/.env` — must be `EXPO_PUBLIC_*` for JS |
| Wire a backend env var | `apps/backend/.env` + `config/configuration.ts` |

---

## Summary

The layout is intentional: **feature-first** on mobile, **domain-modular** on the backend, **shared contracts** in `packages/`. Many modules are still stubs; extending pickups is a straight path: schema → controller → service → DTOs → consume from mobile via `api.ts`.
