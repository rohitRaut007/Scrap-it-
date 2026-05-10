# Backend API Blueprint — Phase Next, P0 (Scrap-it)

**Status:** spec only — no implementation in this document.
**Companion docs:** `docs/backend-api-blueprint-prompt.md` (the prompt that produced this), `docs/pickup-scheduling-flow-spec.md`, `apps/mobile/ARCHITECTURE.md`, `MONOREPO.md`.
**Scope:** P0 — eliminate every mock data source so orders, categories, schedule-pickup, saved addresses, and pickup photos all flow through real backend persistence. Tracking, admin tooling, and notifications are explicitly P1+.

---

## Context

The Scrap-it monorepo today ships a mobile app whose key data flows are mock-driven: `orderService` reads an in-memory repository (`apps/mobile/src/api/repositories/orders.ts`), `categoryService` reads a hardcoded seed (`apps/mobile/src/mock/categories/seed.ts`), the pickup wizard builds addresses from a constants file (`apps/mobile/src/features/pickup/constants/pickup-addresses.ts`), and pickup photos never leave the device.

Meanwhile the NestJS backend has Prisma models for every domain entity (`User`, `Address`, `Category`, `PickupOrder`, `PickupOrderCategory`, `PickupTimeline`, `Collector`, `Notification`) and Supabase JWT auth wired up — but every domain module except `auth`, `analytics`, and `uploads` returns `/status` stubs. The schema is good; the wiring is missing.

This blueprint specifies the HTTP contracts, DTOs, schema deltas, and mobile-side changes required to delete the mock layer in P0.

### Decisions taken

| # | Decision |
|---|---|
| 1 | **Photos in P0:** yes — full presigned-PUT pipeline + `PickupOrderPhoto` table. |
| 2 | **Cancel allowed states:** `scheduled` and `assigned`. `en_route`/`arriving` return 409. |
| 3 | **Response envelope:** new endpoints return `{ data: ... }`. `/auth/me` keeps its existing raw `{ user }` shape — no mobile-client breaking change. |
| 4 | **Idempotency:** backend reads optional `Idempotency-Key` header + `IdempotencyRecord` table in P0. Mobile-side ULID generation deferred to P1. |
| 5 | **Customer resource path:** `/orders` (mobile UI says "orders" everywhere). `/pickups/*` reserved for P1 collector/dispatcher. |
| 6 | **Addresses path:** `/me/addresses/*` — auth scope implicit in URL. |
| 7 | **`defaultAddress` semantics:** `User.defaultAddressId` FK (replaces "most-recently-updated" heuristic). |
| 8 | **Categories seeding:** `prisma/seed.ts` script + `@@unique([name])` migration. |

---

## 1. North-star checklist (mock → API)

| Mock today | Replaced by |
|---|---|
| `orderService` → `apps/mobile/src/api/repositories/orders.ts` | `GET /orders`, `GET /orders/:id`, `GET /orders/active`, `POST /orders`, `POST /orders/:id/cancel` |
| `categoryService` → `apps/mobile/src/mock/categories/seed.ts` | `GET /categories` (DB-backed, seeded via `prisma/seed.ts`) |
| `pickupService.schedulePickup` (calls mock create) | `POST /orders` with `addressId` + `photoStorageKeys[]` |
| Pickup-wizard photos (`file://` URIs only) | `POST /uploads/order-photo-url` + `photoStorageKeys[]` in `CreateOrderDto` + `PickupOrderPhoto` rows + signed read URLs in `OrderDto.photoUrls` |
| `buildPickupAddressOptions` + hardcoded `pickup-addresses.ts` seeds | `GET /me/addresses`, `POST /me/addresses`, `PATCH /me/addresses/:id`, `DELETE /me/addresses/:id`, `POST /me/addresses/:id/default` |
| `defaultAddress` derived as "most recently updated" (`auth.controller.ts:30`) | `User.defaultAddressId` FK; explicit set-default endpoint |

After P0 ships, these files are deleted from the mobile app:
`src/api/repositories/orders.ts`, `src/mock/categories/seed.ts`, `src/mock/orders/seed.ts`, `src/mock/pickups/generators.ts`, `src/mock/seed.ts`.

---

## 2. Feature analysis (mobile-grounded)

| Feature | Mobile entry | Today | Target (P0) |
|---|---|---|---|
| Bootstrap / session check | `src/app/index.tsx:13` (`verifyBackendSession`) | `GET /auth/me` (real) | unchanged |
| Home — categories grid | `src/features/home/home-screen.tsx:32` | `categoryService.list()` → mock seed | `GET /categories` |
| Home — active order card | `src/features/home/home-screen.tsx` | `orderService.getActive()` → mock repo | `GET /orders/active` |
| Home — analytics summary | `src/features/home/home-screen.tsx` | `GET /analytics/summary` (real, but `estimatedPayoutInr` always 0 — leave as-is for P0) | unchanged |
| Profile screen | `src/features/profile/...` | `GET /auth/me` (real) | unchanged |
| Edit profile | `src/features/profile/edit-profile-screen.tsx` | `PATCH /auth/me` (real) | unchanged |
| Saved addresses | `src/features/profile/saved-addresses-screen.tsx` | reads `userService.getCurrent()`, merges with `pickup-addresses.ts` seeds, edit shows "available soon" alert | `GET /me/addresses` + create/edit/delete/set-default flows |
| Pickup wizard step 1 — categories | `src/features/pickup/components/steps/categories-step.tsx` | reads from `categoryService.list()` mock | `GET /categories` |
| Pickup wizard step 2 — photos | `src/features/pickup/components/steps/photos-step.tsx` | up to 6 `file://` URIs collected via `expo-image-picker`, never sent | upload-then-attach pipeline (§8) |
| Pickup wizard step 3 — schedule | `src/features/pickup/components/steps/schedule-step.tsx` | client-side date/slot computation produces `scheduledAtIso` | unchanged (UI only) |
| Pickup wizard step 4 — location | `src/features/pickup/components/steps/location-step.tsx` | `buildPickupAddressOptions` merges `user.defaultAddress` with hardcoded "Home"/"Office" seeds | `GET /me/addresses` |
| Pickup wizard step 5 — review/submit | `src/features/pickup/pickup-flow-screen.tsx:117` | `pickupService.schedulePickup({categoryIds, addressLine, scheduledAt})` → mock create | `POST /orders` with `addressId` + `photoStorageKeys` |
| Orders list | `src/features/orders/orders-screen.tsx` | `orderService.list()` → mock | `GET /orders` |
| Order detail | `src/features/orders/order-detail-screen.tsx` | `orderService.getById(id)` → mock | `GET /orders/:id` |
| Map tab | `src/features/map/map-screen.tsx` | `map-service.ts` haversine on-device | unchanged in P0 — pushed to P1 |
| Auth (sign in / sign up / sign out) | `src/services/authService.ts` | Supabase client (no backend call) | unchanged |
| Onboarding | `src/services/authService.ts` | `AsyncStorage` flag | unchanged |

---

## 3. Resource & route naming

- Customer CRUD lives at **`/orders`**. Mobile UI already uses "orders" everywhere (`orders` tab, `orderService`, `/order/:id` route in `src/app/(app)/order/[id].tsx`).
- **`/pickups/*` reserved for P1** collector/dispatcher operations (claim, en_route, arriving, complete) over the same `PickupOrder` table. Two controllers, same model, role-projected views: `OrdersController` filters by `customerId`, future `PickupsController` filters by `collectorId`.
- Addresses live under **`/me/addresses/*`** — auth scope is implicit in the URL; avoids `?userId=` filters and matches the existing `/auth/me` mount point.
- **No global API prefix** (existing convention — root-level routes).

---

## 4. Complete P0 endpoint catalog

All endpoints require `JwtAuthGuard` unless noted; ownership check in service layer (404 on cross-user reads — never leak existence).

| Module | Method | Path | Request | Response | Replaces | Idempotency |
|---|---|---|---|---|---|---|
| auth | GET | `/auth/me` | — | `MeResponse` (raw) | (already real) | safe (GET) |
| auth | PATCH | `/auth/me` | `UpdateMeDto` | `MeResponse` (raw) | (already real) | last-write-wins |
| categories | GET | `/categories` | — | `{ data: CategoryDto[] }` | `categoryService.list` | safe |
| orders | GET | `/orders` | `ListOrdersQueryDto` (query) | `{ data: OrderDto[], page, pageSize, total }` | `orderService.list` | safe |
| orders | GET | `/orders/active` | — | `{ data: OrderDto \| null }` | `orderService.getActive` | safe |
| orders | GET | `/orders/:id` | path UUID | `{ data: OrderDto }` | `orderService.getById` | safe |
| orders | POST | `/orders` | `CreateOrderDto` (+ optional `Idempotency-Key` header) | `{ data: OrderDto }` (201) | `orderService.create`, `pickupService.schedulePickup` | server-side replay for 24h on `(userId, key)` |
| orders | POST | `/orders/:id/cancel` | `CancelOrderDto` | `{ data: OrderDto }` | (none) | naturally idempotent — re-cancel returns 200 with same row |
| addresses | GET | `/me/addresses` | — | `{ data: AddressDto[] }` | `userService.getCurrent → buildPickupAddressOptions` | safe |
| addresses | POST | `/me/addresses` | `CreateAddressDto` | `{ data: AddressDto }` (201) | seed `pickup-addresses.ts` | n/a |
| addresses | PATCH | `/me/addresses/:id` | `UpdateAddressDto` | `{ data: AddressDto }` | (none — alert stub today) | last-write-wins |
| addresses | DELETE | `/me/addresses/:id` | path UUID | 204 No Content | (none) | second delete returns 404 |
| addresses | POST | `/me/addresses/:id/default` | — | `{ data: AddressDto }` | (none) | naturally idempotent |
| uploads | POST | `/uploads/order-photo-url` | `RequestOrderPhotoUploadDto` | `{ data: SignedUploadResponse }` | local-only `file://` URIs | each call returns a unique key — caller may retry safely |
| uploads | GET | `/uploads/signed-upload-url` | (legacy) | (gate behind `RolesGuard('admin')`) | — | — |

**Why `POST /orders/:id/cancel` not `DELETE /orders/:id`?** Cancellation is a state transition, not a removal — the row must persist for analytics + history. Verb-on-noun matches existing Nest patterns. Mobile `api` client doesn't support DELETE today (`apps/mobile/src/lib/api.ts:116`), so cancel-as-POST avoids a client extension purely for cancel. (We still need `DELETE` for addresses — see §15.)

**Why no `GET /uploads/signed-upload-url` for customers?** The current implementation accepts arbitrary `bucket` + `path` query params (`apps/backend/src/modules/uploads/uploads.controller.ts:11`) — any authenticated user can request a signed PUT to any bucket and any path. This is a path-traversal + cross-user-overwrite vulnerability. **Gate behind `RolesGuard('admin')` or remove before P0 ships.** The new `POST /uploads/order-photo-url` endpoint is the customer-safe replacement.

---

## 5. DTOs — field-level definitions

### 5.1 Response shapes

```ts
class AddressDto {
  id: string                  // UUID
  label: string | null
  line1: string
  line2: string | null
  city: string
  region: string | null
  postalCode: string | null
  country: string             // default "IN"
  isDefault: boolean          // derived from User.defaultAddressId
}

class CategoryDto {
  id: string                  // UUID (was string ID like "metal" in mock)
  name: string
  rateLabel: string
  iconKey: string             // mobile categoryIcons map keys on this — survives migration
}

class DriverDto { id: string; name: string; rating: number }
class OrderItemDto { label: string; quantity: number }

class OrderDto {
  id: string                                // UUID (no more SF-NNNNN strings)
  status: OrderStatus                       // matches Prisma enum + mobile OrderStatus
  categoryIds: string[]                     // UUIDs from PickupOrderCategory
  scheduledAt: string                       // ISO 8601
  etaMinutes: number | null                 // P0: always null
  driver: DriverDto | null                  // P0: always null
  addressId: string                         // UUID — NEW field on mobile
  addressLine: string                       // server-formatted from joined Address row
  items: OrderItemDto[]                     // P0: empty array
  totalWeightKg: number | null              // P0: null on create
  photoUrls: string[]                       // signed read URLs, 1h TTL
  createdAt: string                         // ISO 8601 — NEW
  cancelledAt: string | null                // ISO 8601 — NEW
}

class MeResponse {                          // unchanged shape
  user: {
    id: string
    email: string
    name: string | null
    phone: string | null
    role: 'customer' | 'collector' | 'admin'
    defaultAddress: AddressDto | null       // now derived from User.defaultAddressId
  } | undefined
}

class SignedUploadResponse {
  storageKey: string          // server-generated: orders/{userId}/{ulid}.{ext}
  uploadUrl: string           // presigned PUT URL
  token: string | null        // Supabase signed-upload token if applicable
  expiresAt: string           // ISO 8601
  bucket: string              // diagnostic only — client never picks the bucket
  maxBytes: number            // echoed from request
}
```

### 5.2 Request DTOs

```ts
class UpdateMeDto {                                   // existing — unchanged
  @IsOptional() @IsString() @MaxLength(120) name?: string
  @IsOptional() @IsString() @MaxLength(20)  phone?: string
}

class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus
  @IsOptional() @IsBooleanString() activeOnly?: boolean   // shorthand for status in scheduled|assigned|en_route|arriving
}

class CreateOrderDto {
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  categoryIds: string[]

  @IsISO8601() scheduledAt: string                    // future-only via custom validator

  @IsUUID('4') addressId: string                      // canonical — no free-text addressLine

  @IsOptional() @IsString() @MaxLength(500) notes?: string

  @IsOptional() @IsArray() @ArrayMaxSize(6)
  @IsString({ each: true }) @MaxLength(256, { each: true })
  photoStorageKeys?: string[]                         // verified server-side: must start with orders/{authUser.id}/
}

class CancelOrderDto {
  @IsOptional() @IsString() @MaxLength(280) reason?: string
}

class CreateAddressDto {
  @IsOptional() @IsString() @MaxLength(40)  label?: string
  @IsString() @MaxLength(200)               line1: string
  @IsOptional() @IsString() @MaxLength(200) line2?: string
  @IsString() @MaxLength(80)                city: string
  @IsOptional() @IsString() @MaxLength(80)  region?: string
  @IsOptional() @IsString() @MaxLength(20)  postalCode?: string
  @IsOptional() @IsString() @Length(2,2)    country?: string  // default "IN"
  @IsOptional() @IsLatitude()               latitude?: number
  @IsOptional() @IsLongitude()              longitude?: number
  @IsOptional() @IsBoolean()                isDefault?: boolean
}

class UpdateAddressDto {                              // partial of CreateAddressDto, every field @IsOptional
}

class RequestOrderPhotoUploadDto {
  @IsString() @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string

  @IsInt() @Min(1) @Max(10 * 1024 * 1024)             // 10MB cap per photo
  contentLength: number
}
```

### 5.3 Mobile type changes (`apps/mobile/src/types/domain.ts`)

| Type | Field changes |
|---|---|
| `PickupOrder` | **add** `addressId: string`; **add** `photoUrls?: string[]`; **add** `createdAt?: string`; **add** `cancelledAt?: string \| null`. Keep `etaMinutes`, `driver`, `items`, `totalWeightKg` optional/nullable — server returns null in P0. |
| `AddressSummary` | **add** `isDefault?: boolean`. |
| `Category` | unchanged shape; **note**: `id` becomes a UUID after migration (was string like `"metal"`). |
| `User` | unchanged — `defaultAddress` keeps shape; only the server-side derivation changes. |
| `OrderStatus` | unchanged. |
| `AnalyticsSummary` | unchanged in P0. |

---

## 6. Order create payload — design notes

- **`addressId` REQUIRED**, no free-text address. Mobile draft already carries `addressId` (`apps/mobile/src/features/pickup/types/pickup-flow.ts:24`). Server formats `addressLine` for the response from the joined `Address` row.
- **For users with zero saved addresses:** mobile must call `POST /me/addresses` first. The location step's "Add new address" CTA (alert stub today on `pickup-flow-screen.tsx:204`) becomes navigation to a new add-address screen.
- **Photos in-payload via `photoStorageKeys: string[]`.** Wizard's photo step (step 2) runs *before* the address step (step 4), so two-step "create-then-attach" inverts the UX and creates an orphan-order risk if attach fails. Client uploads each photo via `POST /uploads/order-photo-url` returning a server-generated `storageKey`; submit sends the array.
- **Server verifies on create** that every `storageKey` starts with `orders/{authUser.id}/` and that the object exists in the bucket; rejects 400 otherwise. Persists to `PickupOrderPhoto` inside the create transaction.
- **No base64 photos in JSON** — 6 × ~2MB = 12MB, wrong layer. Presigned PUT direct to storage scales better and matches existing `UploadsService`.
- **`Idempotency-Key` header** (optional in P0): on first successful create, server writes `IdempotencyRecord(userId, key, responseJson, createdAt)`. Subsequent same-key requests within 24h return the stored response. Mobile button-disabling protects against double-submit today, so mobile-side ULID generation is deferred to P1.

---

## 7. Mock → API replacement matrix

| Mobile file:method | Endpoint | Mobile change |
|---|---|---|
| `services/orderService.ts:list` | `GET /orders` | rewrite body to `api.get<{data: OrderDto[]}>("/orders").then(r => r.data)` |
| `services/orderService.ts:getById` | `GET /orders/:id` | call site; map 404 → null |
| `services/orderService.ts:getActive` | `GET /orders/active` | direct call |
| `services/orderService.ts:create` | `POST /orders` | strip `addressLine` arg; pass `addressId`, `photoStorageKeys` |
| `services/pickupService.ts:schedulePickup` | `POST /orders` (via orderService) | new signature `{ categoryIds, addressId, scheduledAt, photoStorageKeys?, notes? }` |
| `services/categoryService.ts:list` | `GET /categories` | rewrite |
| `api/repositories/orders.ts` | (delete) | remove imports in `orderService.ts` |
| `mock/categories/seed.ts` | (delete) | remove import in `categoryService.ts` |
| `mock/orders/seed.ts` | (delete) | — |
| `mock/pickups/generators.ts` | (delete) | — |
| `mock/seed.ts` | (delete after audit) | grep first |
| `features/pickup/constants/pickup-addresses.ts:buildPickupAddressOptions` | `GET /me/addresses` | rewrite to consume `AddressDto[]` (or replace with `useAddressOptions()` hook) |
| `features/profile/saved-addresses-screen.tsx` | `GET /me/addresses` + edit/delete/setDefault | full rewrite; remove "available soon" alert (line 46) |
| `features/pickup/components/steps/photos-step.tsx` | `POST /uploads/order-photo-url` + PUT | upload on pick; store `storageKey`; show progress + retry |
| `features/pickup/types/pickup-flow.ts` | (type) | add `photoStorageKeys: string[]`; decide whether `photoUris` becomes per-photo `{uri, storageKey?, status}` |
| `features/pickup/pickup-flow-screen.tsx:117` | (call site) | pass `addressId` + `photoStorageKeys`; replace alert stub on line 204 with navigation to add-address screen |
| `services/uploadsService.ts` (new) | new | `requestOrderPhotoUpload`, `uploadOrderPhoto` |
| `services/addressService.ts` (new) | new | `list/create/update/delete/setDefault` |
| `lib/api.ts` | add `delete<T>()` | mirror `patch` |

---

## 8. Photo upload pipeline

**Bucket:** `order-photos` (private — Supabase Storage policy denies public reads; access only via signed URLs).
**Path convention:** `orders/{userId}/{ulid}.{ext}` where `ext ∈ {jpg, png, webp}`. ULID is server-generated to prevent collisions and make ordering trivial.
**MIME enforced server-side:** `image/jpeg | image/png | image/webp`.
**Size cap:** 10MB per photo (DTO + storage policy). 6 photos × 10MB = 60MB max per order.

| # | Actor | Step | File |
|---|---|---|---|
| 1 | Mobile | User taps "Add photo"; `expo-image-picker` returns local URI + size + mime | `apps/mobile/src/features/pickup/components/steps/photos-step.tsx:18-65` |
| 2 | Mobile | For each picked asset, call `POST /uploads/order-photo-url` with `{contentType, contentLength}` | new `services/uploadsService.ts` |
| 3 | Backend | `UploadsController.requestOrderPhotoUpload` validates DTO; generates `ulid`; constructs `storageKey = "orders/${authUser.id}/${ulid}.${ext}"`; calls `client.storage.from('order-photos').createSignedUploadUrl(key)`; returns `{ storageKey, uploadUrl, token, expiresAt, bucket, maxBytes }` | `apps/backend/src/modules/uploads/uploads.controller.ts` |
| 4 | Mobile | PUT photo bytes directly to `uploadUrl` with `Content-Type` (and Supabase's `x-upsert: false` if applicable); on success, store `storageKey` in `draft.photoStorageKeys[]` | new `uploadsService.uploadOrderPhoto(asset)` |
| 5 | Mobile | UI shows local URI for preview until upload resolves, then shows uploaded badge / per-photo progress + retry | `photos-step.tsx` rewrite |
| 6 | Mobile | On submit, send `photoStorageKeys` in `CreateOrderDto` | `pickup-flow-screen.tsx:117` |
| 7 | Backend | `OrdersService.create` verifies each key starts with `orders/${authUser.id}/` and that the object exists in storage; rejects 400 otherwise. Persists `PickupOrderPhoto` rows inside the create transaction. | new `apps/backend/src/modules/orders/orders.service.ts` |
| 8 | Backend | On `GET /orders/:id` and `GET /orders`, generate `client.storage.from('order-photos').createSignedUrl(key, 3600)` per photo; return as `OrderDto.photoUrls[]` | `orders.service.ts` |
| 9 | Mobile | Order detail screen renders thumbnails from `photoUrls` | `apps/mobile/src/features/orders/order-detail-screen.tsx` |

---

## 9. Address `defaultAddress` semantics

**Decision: `User.defaultAddressId String? @db.Uuid @unique` FK with `onDelete: SetNull`.**

Rejected alternatives:
- (a) `Address.isDefault` boolean: requires a partial unique index `WHERE isDefault = true` per user, and every "set default" needs a transaction to flip the previous winner. Two writes for what should be one.
- (b) "most-recently-updated" heuristic (current behavior at `apps/backend/src/modules/auth/auth.controller.ts:30`): editing any address silently changes the default. Surprising once users have multiple addresses.
- (c) FK on `User`: single source of truth, single write to change default, easy constraints (`onDelete: SetNull` so deleting the address blanks the default).

Migration plan:
1. Add `User.defaultAddressId` + Prisma `@@relation("UserDefaultAddress", fields: [defaultAddressId], references: [id], onDelete: SetNull)`.
2. **Backfill:** for each user, set `defaultAddressId = (most recently updated address)` — preserves observable behavior on day 1.
3. New endpoint `POST /me/addresses/:id/default` flips the FK in a single write.
4. `CreateAddressDto.isDefault = true` (or first-ever address) auto-sets the default server-side.
5. `AuthController.buildMeResponse` (`auth.controller.ts:26-58`) switches from `orderBy: updatedAt take: 1` to a join via `defaultAddressId` — observably identical for users with one address; intentional semantics change for users with multiple.
6. `AddressDto.isDefault` is derived in `AddressesService.list` by comparing each row's id to `user.defaultAddressId`.

---

## 10. Order status transitions in P0

| From | To | Endpoint | Allowed |
|---|---|---|---|
| (none) | scheduled | `POST /orders` | yes |
| scheduled | cancelled | `POST /orders/:id/cancel` | **yes** |
| assigned | cancelled | `POST /orders/:id/cancel` (with `reason`) | **yes** |
| en_route | cancelled | — | **no** — 409 `"Driver is en route. Contact support to cancel."` |
| arriving | cancelled | — | **no** — 409 |
| completed | * | — | terminal |
| cancelled | * | — | terminal (idempotent re-call returns 200, same row, no transition) |
| any → assigned/en_route/arriving/completed | (collector) | — | **P1 — out of scope** |

**Guards:** `JwtAuthGuard` + ownership check (`order.customerId === authUser.id`) on every order endpoint. Cross-user reads return 404 (do not leak existence).

**Cancel implementation:** `OrdersService.cancel` throws `ConflictException` on disallowed transitions, otherwise inserts a `PickupTimeline` row `{ eventType: 'cancelled', occurredAt: now(), metadata: { reason, actorId, actorRole: 'customer' } }` and sets denormalized `PickupOrder.cancelledAt` (added in same migration as the `defaultAddressId` change). Both writes happen inside a `prisma.$transaction`.

**Create implementation:** `OrdersService.create` writes the `PickupOrder` row, the `PickupOrderCategory` joins, the `PickupOrderPhoto` rows, an initial `PickupTimeline` `{ eventType: 'created' }` row, and the `IdempotencyRecord` (if `Idempotency-Key` header was sent) — all inside a single `prisma.$transaction`. If photo verification fails for any key, the transaction rolls back.

---

## 11. API modules — Nest mapping

Backend modules under `apps/backend/src/modules/`. Status as of this blueprint:

| Module | Today | P0 changes |
|---|---|---|
| `auth` | `GET /auth/me`, `PATCH /auth/me` real | switch `defaultAddress` derivation to FK lookup (§9 step 5) |
| `users` | `GET /users/status` stub | mount addresses sub-resource at `/me/addresses` (§4); keep `/status` as harmless probe |
| `orders` | `GET /orders/status` stub | full controller + service + DTOs per §4–§5 |
| `pickups` | `GET /pickups/status` stub | **unchanged in P0** — reserved for P1 collector views |
| `categories` | `GET /categories/status` stub | replace stub with `GET /categories` (active=true, ordered by name); add `prisma/seed.ts` |
| `uploads` | `GET /uploads/signed-upload-url` (insecure), real Supabase plumbing | add `POST /uploads/order-photo-url`; gate or remove the legacy endpoint |
| `analytics` | `GET /analytics/summary` real | unchanged |
| `notifications` | `GET /notifications/status` stub | **unchanged** — no mobile consumer |
| `collectors` | `GET /collectors/status` stub | **unchanged** — P1 |
| `admin` | `GET /admin/ping` real | unchanged |

**No new top-level modules.** Every P0 endpoint fits into existing modules — the schema and module skeleton already match the blueprint. Implementation is filling in services, DTOs, and controllers, not architectural change.

---

## 12. Database / domain (Prisma)

### 12.1 Existing models — reuse as-is

`User`, `Address`, `Category`, `Collector`, `PickupOrder`, `PickupOrderCategory`, `PickupTimeline`, `Notification` (`apps/backend/prisma/schema.prisma:33-146`).

### 12.2 Schema additions in P0

```prisma
model User {
  // ...existing fields
  defaultAddressId String?  @unique @db.Uuid
  defaultAddress   Address? @relation("UserDefaultAddress", fields: [defaultAddressId], references: [id], onDelete: SetNull)
}

model Address {
  // ...existing fields
  defaultedByUser User? @relation("UserDefaultAddress")
}

model Category {
  // ...existing fields
  @@unique([name])
}

model PickupOrder {
  // ...existing fields
  cancelledAt DateTime?
  photos      PickupOrderPhoto[]
}

model PickupOrderPhoto {
  id          String      @id @default(uuid()) @db.Uuid
  orderId     String      @db.Uuid
  storageKey  String      @unique
  contentType String
  createdAt   DateTime    @default(now())
  order       PickupOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@index([orderId])
}

model IdempotencyRecord {
  userId       String   @db.Uuid
  key          String
  responseJson Json
  createdAt    DateTime @default(now())
  @@id([userId, key])
  @@index([createdAt])
}
```

### 12.3 Seed strategy — categories

`prisma/seed.ts` (new file) wired into `package.json` as `prisma.seed`. Idempotent via `upsert` on `name` (made unique by the migration above). Seed contents match the mobile mock (`apps/mobile/src/mock/categories/seed.ts`):

```ts
[
  { name: "Metal",       rateLabel: "₹40–50/kg",  iconKey: "metal" },
  { name: "Paper",       rateLabel: "₹14–18/kg",  iconKey: "paper" },
  { name: "Plastic",     rateLabel: "₹8–12/kg",   iconKey: "plastic" },
  { name: "E-Waste",     rateLabel: "₹20–100/kg", iconKey: "electronics" },
  { name: "Appliances",  rateLabel: "₹15–30/kg",  iconKey: "appliances" },
  { name: "Glass",       rateLabel: "₹2–5/kg",    iconKey: "glass" },
]
```

Rejected alternatives:
- **Admin-managed** — P0 has no admin UI; defers a feature we don't need.
- **On-startup seeding** — couples startup time to DB; re-runs in production every boot.

---

## 13. Backend architecture (Nest)

- **Service boundaries:** one service per module (`OrdersService`, `AddressesService`, `CategoriesService`, `UploadsService`). All Prisma access flows through services, never controllers.
- **Validation:** existing global `ValidationPipe` (`main.ts:9-15`, `whitelist + forbidNonWhitelisted + transform`) handles every DTO.
- **Errors:** existing global `HttpExceptionFilter` (`main.ts:17`) produces uniform `{ statusCode, message }`. Throw `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException` from services.
- **Ownership:** every order/address service method takes `authUser.id` and filters/scopes; cross-user reads return **404 (not 403)** to avoid leaking row existence.
- **Transactions:** `OrdersService.create` and `OrdersService.cancel` run in `prisma.$transaction` covering all related writes (order + photos + categories + timeline + idempotency record).
- **Photo verification:** `UploadsService.verifyOrderPhotoKey(userId, key)` returns boolean; called per key inside the create transaction. If any verification fails, the transaction rolls back.
- **Read-time signed URLs:** generated lazily in `OrdersService.findOne` / `findMany` mappers; 1-hour TTL is fine for app sessions.
- **Idempotency:** when an `Idempotency-Key` header is present on `POST /orders`, the service first checks `IdempotencyRecord` for `(userId, key)`; if found, return stored response. Otherwise execute the create transaction and write the record before commit. Records older than 24h are purged by a periodic job (left to implementation).
- **DTO shape:** every Nest controller returns the `{ data: ... }` envelope on new endpoints, matching the catalog. `/auth/me` keeps its existing raw shape.
- **CORS:** existing config (`main.ts:20-24`) uses `CORS_ORIGINS` env. No P0 changes.

---

## 14. Implementation phases

### P0 — this blueprint

**Backend:**
- Schema migration: `User.defaultAddressId`, `Category @@unique([name])`, `PickupOrder.cancelledAt`, `PickupOrderPhoto` model, `IdempotencyRecord` model. Backfill `defaultAddressId` in the same migration.
- `prisma/seed.ts` with the 6 categories; wire into `package.json`.
- `orders` module: controller + service + DTOs. Endpoints: list, active, getById, create (with idempotency), cancel.
- `categories` module: replace stub with `GET /categories`.
- `users` module: addresses controller + service + DTOs at `/me/addresses` for list, create, update, delete, set-default.
- `uploads` module: add `POST /uploads/order-photo-url`; constrain bucket + path server-side; gate the legacy `GET /uploads/signed-upload-url` behind `RolesGuard('admin')`.
- `auth` module: switch `buildMeResponse` to FK-based default address lookup.

**Mobile:**
- `services/orderService.ts`, `services/pickupService.ts`, `services/categoryService.ts` rewritten to call HTTP.
- New `services/addressService.ts`, `services/uploadsService.ts`.
- `lib/api.ts`: add `delete<T>()`.
- `types/domain.ts`: field additions per §5.3.
- `features/pickup/constants/pickup-addresses.ts`: rewrite consumer to take `AddressDto[]`.
- `features/pickup/components/steps/photos-step.tsx`: wire upload pipeline.
- `features/pickup/types/pickup-flow.ts`: add `photoStorageKeys`.
- `features/pickup/pickup-flow-screen.tsx`: pass `addressId` + `photoStorageKeys`; replace add-address alert stub with navigation.
- `features/profile/saved-addresses-screen.tsx`: full rewrite consuming `addressService`.
- New screens: add-address, edit-address (or one combined).
- Delete: `src/api/repositories/orders.ts`, `src/mock/categories/seed.ts`, `src/mock/orders/seed.ts`, `src/mock/pickups/generators.ts`, `src/mock/seed.ts`.

### P1 — collector / dispatcher

- `/pickups/*` collector endpoints: `claim`, `en_route`, `arriving`, `complete`, `assignment` queue.
- Driver assignment workflow + `OrderDto.driver`/`etaMinutes` populated from real backend state.
- Order status transitions beyond customer-cancel.
- Read-side `PickupTimeline` endpoint for the order detail screen.
- Real `etaMinutes` from a backend routing service (replacing on-device haversine in `apps/mobile/src/features/map/service/map-service.ts`).
- Mobile-side ULID generation for `Idempotency-Key` on `POST /orders`.

### P2 — admin / notifications

- Admin tooling: categories CRUD, manual collector assignment, dashboard analytics.
- `notifications` module wire-up: list, mark-read; expo push token registration.
- Search/filter on orders (only when UI exists).
- Real `estimatedPayoutInr` calculation in `analytics.controller.ts:38`.

---

## 15. Mobile-side changes — explicit list

- `apps/mobile/src/types/domain.ts`:
  - `PickupOrder`: add `addressId: string`, `photoUrls?: string[]`, `createdAt?: string`, `cancelledAt?: string | null`.
  - `AddressSummary`: add `isDefault?: boolean`.
- `apps/mobile/src/lib/api.ts`: add `delete<T>(path)` mirroring `patch`.
- Rewrite `services/categoryService.ts`, `services/orderService.ts`, `services/pickupService.ts` per matrix in §7.
- New: `services/addressService.ts`, `services/uploadsService.ts`.
- `features/pickup/types/pickup-flow.ts`: add `photoStorageKeys: string[]` to `PickupFlowDraft`. Decide whether `photoUris` becomes per-photo `{uri, storageKey?, status}` or stays parallel.
- `features/pickup/components/steps/photos-step.tsx`: wire upload pipeline (per §8).
- `features/pickup/pickup-flow-screen.tsx`:
  - Submit (line 117): pass `addressId` + `photoStorageKeys` to `pickupService.schedulePickup`.
  - Replace alert stub on line 204 with navigation to a new add-address screen.
- `features/pickup/constants/pickup-addresses.ts`: rewrite `buildPickupAddressOptions` to consume `AddressDto[]` from API (or replace with `useAddressOptions()` hook).
- `features/profile/saved-addresses-screen.tsx`: full rewrite consuming `addressService.list/setDefault/delete` + add navigation to add/edit. Drop `userService.getCurrent` + `buildPickupAddressOptions` dependencies. Remove "Saving multiple addresses will be available soon" alert (line 46).
- New screens: `add-address-screen.tsx`, `edit-address-screen.tsx` (or one combined screen reusing a form component) wired to `addressService.create/update`.
- Audit `apps/mobile/src/features/home/home-screen.tsx:32` — `categoryIcons` map keys on `iconKey`, so it survives the UUID switch.
- Audit `apps/mobile/src/app/(app)/pickup/index.tsx` and `pickup-flow-screen.tsx:28` — `?categoryId=` deep-link param expects strings like `"metal"` today; after migration it's a UUID. Confirm nothing else hardcodes `"metal"`/`"paper"` etc.
- Delete: `src/api/repositories/orders.ts`, `src/mock/categories/seed.ts`, `src/mock/orders/seed.ts`, `src/mock/pickups/generators.ts`, `src/mock/seed.ts` (after import audit).

---

## 16. Out of scope (explicit non-goals for P0)

- Push notifications (mobile has no token registration).
- Order search / advanced filtering (mobile list is sort-only today).
- Real `etaMinutes` / driver tracking / map routing endpoints.
- Admin-managed categories, analytics dashboards.
- Real `estimatedPayoutInr` calculation.
- Mobile-side ULID generation for idempotency key.

---

## 17. Verification

Once implemented (separate phase), end-to-end verification:

1. **Type & build:**
   - `pnpm --filter backend typecheck && pnpm --filter backend build`.
   - `pnpm --filter mobile typecheck`.
2. **Database:**
   - `pnpm --filter backend prisma migrate dev` runs cleanly on a fresh DB.
   - `pnpm --filter backend prisma db seed` populates 6 categories; re-running is idempotent.
3. **Backend integration tests** (recommended additions, not in P0 spec):
   - `POST /orders` with valid payload returns 201 + UUID; row exists in DB; timeline `created` row inserted.
   - `POST /orders` with same `Idempotency-Key` twice returns identical body.
   - `POST /orders` with photo key from another user is rejected 400.
   - `POST /orders/:id/cancel` from `scheduled` and `assigned` succeed; from `en_route` returns 409.
   - `GET /orders/:id` for another user's order returns 404 (not 403).
   - `DELETE /me/addresses/:id` for the user's default address sets `User.defaultAddressId = NULL`.
4. **Mobile end-to-end:**
   - Sign in → home loads categories from `GET /categories`, active order from `GET /orders/active`, analytics from `GET /analytics/summary`.
   - Pickup wizard: pick categories, add 3 photos (verify each PUT to Supabase), pick scheduled time, pick saved address (or create new), submit. Confirm new order appears in `/orders` tab and detail screen renders `photoUrls`.
   - Saved addresses tab: create, edit, delete, set-default. Confirm `/auth/me` `defaultAddress` updates.
   - Cancel a `scheduled` order from order detail; confirm `cancelledAt` populated.
5. **Mock removal verification:** grep mobile for `mock/`, `repositories/orders`, `pickup-addresses` — all imports gone.

---

## Revision history

- **2026-05-10** — Initial blueprint. P0-focused. Decisions: photos in P0, cancel allowed in scheduled+assigned, `{ data: ... }` envelope on new endpoints, server-only idempotency in P0, `/orders` for customer CRUD, `/me/addresses/*` scope, `defaultAddressId` FK, prisma seed for categories.
