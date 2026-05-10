# Backend API blueprint — master prompt & audit guide (Scrap-it)

Use this document when you want an AI agent or engineer to produce a **MASTER BACKEND API BLUEPRINT** aligned with **this monorepo**, not generic CRUD.

**Companion docs:** `docs/pickup-scheduling-flow-spec.md` (pickup wizard only), `apps/mobile/ARCHITECTURE.md`, `MONOREPO.md`.

---

## North star — next phase (non-static app)

**Product goal:** Scrap-it must stop behaving like a **static / demo** client. Every screen that today reads **seed data, in-memory repositories, or fake routes** must be backed by **real persistence and real user-linked data** on the backend.

**Engineering goal:** Plan and specify the **full set of HTTP APIs** (new, extended, or reused from existing Nest modules) so that:

- **Orders / pickups** come from the database per authenticated user, not `orderRepository` mocks.
- **Categories** are served by the API (or synced from admin-managed source), not `mock/categories` seeds only.
- **Profile + addresses** reflect **real saved user records**; hardcoded address seeds in the pickup flow are replaced by API-backed address data where the product requires it.
- **Scheduling a pickup** creates **persisted** orders/pickups and returns real IDs — same flows the UI already implements, wired to production contracts.
- **Photos / uploads** (if product keeps them) have a defined **upload-then-attach** path via backend storage — not orphaned `file://` URIs only.
- **Analytics / impact** stats reflect **aggregated real activity** when that is the intended UX (align `AnalyticsSummary` with backend truth).

The blueprint is **not** “document what exists.” It is the **integration plan for Phase Next**: *what we design, implement, and wire so mock layers can be deleted or bypassed in production.*

**Outputs must include:**

1. **Complete API list** — every endpoint the mobile app needs to call for this phase so **no feature remains mock-driven** (group by module; note auth on each).
2. **Mock → API replacement matrix** — table mapping each mock/service path (e.g. `orderRepository`, `categorySeeds`, `pickup-addresses` seeds, client-only map route) to the **replacement contract** (path, method, DTOs).
3. **New vs existing** — for each area: reuse Nest controller as-is, extend DTOs, or **design new endpoints**; justify briefly.

---

## How integration works today (baseline audit)

| Layer | Implementation |
|--------|------------------|
| Identity | Supabase Auth in mobile (`authService`, `lib/supabase.ts`) |
| API transport | `apps/mobile/src/lib/api.ts` — `fetch` to `EXPO_PUBLIC_API_BASE_URL`, `Authorization: Bearer` from Supabase session |
| Backend auth | Nest validates JWT (`modules/auth`, Supabase JWT strategy) |

**Already backend-backed from mobile**

- `GET /auth/me`, `PATCH /auth/me` — via `userService` (`apps/mobile/src/services/userService.ts`)
- `GET /analytics/summary` — via `analyticsService`; shape `AnalyticsSummary` in `apps/mobile/src/types/domain.ts`

**Must move off mocks / local-only for the non-static phase**

- **Orders:** `orderService` → `apps/mobile/src/api/repositories/orders.ts` (in-memory + seeds) → **persisted orders API**
- **Categories:** `categoryService` → `apps/mobile/src/mock/categories/seed.ts` → **categories API**
- **Schedule pickup:** `pickupService.schedulePickup` → `orderService.create` → mock repo → **real create-order/pickup API + DB**
- **Pickup photos:** local `file://` URIs → **uploads module + attach to order/pickup** (specify contract)
- **Address picker / saved addresses:** seeds in `features/pickup/constants/pickup-addresses.ts` + partial user default → **users/addresses APIs** as designed in blueprint
- **Map tab:** client synthetic route → either **keep client-only** for MVP or specify **backend/route/tracking APIs** if Phase Next includes live ETA — blueprint must **choose and document**

**Deferrable only if explicitly scoped to a later milestone**

- Push notifications (no token registration in app yet) — list **optional** follow-up APIs, do not block **core data** APIs.
- Rich order search/filter — add when UI exists; **list + detail for current user** is in scope for non-static orders.

---

## Existing backend modules (reconcile, extend, fill gaps)

Inventory under `apps/backend/src/modules/` before proposing new top-level domains:

- `auth`, `users`, `categories`, `orders`, `pickups`, `collectors`, `uploads`, `notifications`, `analytics`, `admin`

Align mobile `services/` + `types/domain.ts` with these modules. Prefer **implementing or extending** these modules so Nest stays cohesive; add modules only when the audit proves a gap.

---

## Master prompt (paste into Agent / ticket)

**Role:** Senior Backend Architect, Senior Mobile Systems Engineer, Senior API Product Designer.

**Project:** Scrap-it monorepo (`apps/mobile` Expo app + `apps/backend` NestJS).

**Objective:** Produce a **MASTER BACKEND API BLUEPRINT** that enables the **next phase: a fully working, non-static app** — **real users** (Supabase identity + backend user/profile rows), **real persisted orders/pickups/categories/addresses/uploads/analytics** as required by existing screens. Derive every requirement from the **actual mobile app** and **reconcile** with **existing Nest modules** (implement missing endpoints, extend DTOs, design new routes where needed).

Do **not** implement application code in this phase unless the ticket says otherwise — **research, specification, and complete endpoint list only.**

### Sources you MUST read first

1. **Mobile routes** — `apps/mobile/src/app/**` (Expo Router): splash/bootstrap, `(auth)/onboarding`, `login`, `(tabs)/home`, `map`, `orders`, `profile`, `(app)/pickup`, `(app)/order/[id]`, `edit-profile`, `saved-addresses`.
2. **API client** — `apps/mobile/src/lib/api.ts`.
3. **Auth** — `apps/mobile/src/services/authService.ts`, `apps/mobile/src/lib/supabase.ts`; bootstrap uses `GET /auth/me` (`apps/mobile/src/app/index.tsx`).
4. **Domain types** — `apps/mobile/src/types/domain.ts`.
5. **All services** — `apps/mobile/src/services/*.ts` — classify each method as HTTP vs mock vs hybrid and **define the replacement** for mock-backed methods.
6. **Mocks** — `apps/mobile/src/api/repositories/orders.ts`, `apps/mobile/src/mock/**`, seeded address helpers under `features/pickup/constants/`.
7. **Features** — at minimum: `features/home`, `features/pickup`, `features/orders`, `features/map`, `features/profile`, `features/auth`, `features/onboarding`.
8. **Backend** — controllers, services, Prisma models under `apps/backend/src/modules/*` — map **every mobile gap** to an implemented or **new** endpoint.

### Investigation checklist

For **each** route/screen above: **data read**, **data written**, **navigation**, **current backing service**, **target HTTP contract for non-static phase**.

Cover explicitly:

- Bootstrap / `verifyBackendSession` + `/auth/me`.
- Home parallel loads: categories, active order, user, analytics summary — **all backed by DB-backed APIs**.
- Pickup wizard: `PickupFlowDraft`, submit payload vs persisted order/pickup + optional uploads.
- Orders list/detail: `OrderStatus`, timeline, driver/ETA fields — **persisted order resource**.
- Profile / edit profile / saved addresses — **real user + address resources** (no reliance on demo seeds for production path).
- Map: document whether Phase Next keeps synthetic routing or adds backend positioning/route — **explicit decision** in blueprint.

### Required output sections

1. **North-star checklist** — bullet list: “mock X replaced by API Y” for each remaining static dependency.
2. **Feature analysis (mobile-grounded)** — Per feature: flow, **today** vs **target** data source.
3. **API modules** — Map to `apps/backend/src/modules/*`; note **new routes or DTO changes** per module.
4. **Complete endpoint catalog** — Full table of **working APIs for Phase Next**: method, path, auth, request/response DTOs (aligned with `domain.ts` / `MeResponse`), validation notes. This is the **authoritative list** for implementation.
5. **Mock replacement matrix** — File/service → endpoint(s) that supersede it.
6. **Database / domain** — Entities and relationships for persisted orders, pickups, categories, users, addresses, uploads, analytics aggregates.
7. **Backend architecture (Nest)** — Service boundaries, Prisma, uploads pipeline, idempotency/concurrency where orders are created.
8. **Implementation phases** — **P0:** eliminate data mocks (orders, categories, schedule, user addresses as scoped). **P1:** tracking/map/driver/collector visibility. **P2:** admin ops, notifications. Must still list **all P0 APIs** completely.

### Scope discipline

- **In scope:** Every API required so **no production feature depends on `mock/` or in-memory order repository** for real installs.
- **Explicitly optional:** Push notifications, advanced search — appendix only; must not omit **core CRUD/list/create** for screens that already exist.

### Style

Traceability: **file path → API**. Tables welcome. Production-realistic payloads; scalability tied to real domain (timelines, assignment, uploads).

---

## One-line Agent prepend

Read `apps/mobile/src/services/*`, `apps/mobile/src/types/domain.ts`, `apps/mobile/src/lib/api.ts`, and `apps/backend/src/modules/*`; produce the **complete Phase Next endpoint catalog** and **mock replacement matrix** so the app is **non-static**.

---

## Revision history

- **v2:** North star = non-static app; complete working API list; mock→API matrix; real users/data; new/extended endpoints explicitly in scope.
- **v1:** Initial baseline (hybrid integration vs mocks documented).
