# Pickup scheduling flow — product & engineering spec (Scrap-it mobile)

This document refines the **pickup scheduling enhancement** brief against the **current codebase** in `apps/mobile`. It is the single reference for UX goals, architecture alignment, and safe extension points.

**Related repo docs:** `apps/mobile/ARCHITECTURE.md`, `MONOREPO.md`.

---

## 1. Purpose

Guide future scheduling UX and logic work so that:

- The experience stays **premium, guided, and low-friction** (Uber / Urban Company–style clarity without copying visuals).
- Implementation **extends** what exists: same visual language, same NativeWind tokens, same feature-first layout.
- New steps and selectors are **modular, typed, and configuration-driven** where the app already patterns that way.

---

## 2. Tech stack (as implemented)

| Layer | Implementation |
|--------|-----------------|
| App runtime | React Native, Expo (SDK per `apps/mobile/ARCHITECTURE.md`) |
| Routing | Expo Router — `src/app/` |
| Styling | NativeWind v4 + Tailwind — `tailwind.config.js`, `src/global.css` |
| UI primitives | `src/components/ui` (e.g. `Button`, `Text`, `Card`) |
| Feature code | `src/features/<domain>/` — **no cross-feature imports** |
| Data access | `src/services/` facades → `src/api/` (mock today, swappable later) |

---

## 3. Current pickup flow — inventory

### 3.1 Route entry

| Item | Location |
|------|----------|
| Pickup screen route | `src/app/(app)/pickup/index.tsx` — thin wrapper rendering `PickupFlowScreen` |
| Main orchestrator | `src/features/pickup/pickup-flow-screen.tsx` |

The route stays **thin**; all wizard logic and composition live in the feature module (per `ARCHITECTURE.md`).

### 3.2 Step order (configuration-driven)

Defined in `src/features/pickup/constants/pickup-flow-steps.ts`:

1. `categories` — scrap categories (`CategoriesStep`)
2. `photos` — optional photos (`PhotosStep`)
3. `schedule` — date + time slot (`ScheduleStep`)
4. `location` — address selection (`LocationStep`)
5. `review` — summary (`ReviewStep`)

Step IDs are typed in `src/features/pickup/types/pickup-flow.ts` as `PickupFlowStepId`. Reordering or inserting steps should update:

- `PICKUP_FLOW_STEP_IDS` / `PICKUP_FLOW_STEP_COUNT`
- `PickupFlowStepId` and `PickupFlowDraft` if new fields are needed
- `canProceedPickupStep` in `src/features/pickup/hooks/use-pickup-flow.ts`
- Conditional rendering in `pickup-flow-screen.tsx` (or a small step-renderer map if refactored)

### 3.3 State management

| Concern | Implementation |
|---------|----------------|
| Wizard position | `useState` for `stepIndex` in `usePickupFlow` |
| Form payload | `PickupFlowDraft` in `usePickupFlow`, updated via `patchDraft` / `setDraft` |
| Derived schedule | `mergePickupDraft` recomputes `scheduledAtIso` from `scheduleDateKey` + time slot via `buildLocalScheduledIso` and `getPickupTimeSlot` |
| Validation | `canProceedPickupStep(stepId, draft)` — per-step gates for Continue |

There is **no** global wizard store today; keeping draft in the hook preserves simplicity. If the flow grows, extracting a small reducer or context **inside `features/pickup`** is acceptable as long as primitives and services stay unchanged.

### 3.4 Draft model (scheduling-relevant fields)

From `PickupFlowDraft`:

- `scheduleDateKey` — local calendar key `YYYY-MM-DD`
- `selectedTimeSlotId` — id from `PICKUP_TIME_SLOTS` (`constants/time-slots.ts`)
- `scheduledAtIso` — ISO string passed to `pickupService.schedulePickup`

Supporting utilities: `upcomingDateKeys`, `schedule-date-utils.ts`, `DateScrollRow`, `TimeSlotList`.

### 3.5 Progress / chrome

| Component | Role |
|-----------|------|
| `components/progress/pickup-step-header.tsx` | Title “Schedule pickup”, “Step X of Y”, segmented progress bar |
| Bottom bar in `pickup-flow-screen.tsx` | Primary `Button`: “Continue” vs “Confirm pickup” on review |

The header uses `Text` variants, `cn`, `useAppTheme` for icon color, and semantic classes (`bg-background`, `bg-primary`, `border-border`, `dark:` variants). **New progress patterns** should extend this file or sibling components under `components/progress/`, not duplicate chrome.

### 3.6 Scheduling UI building blocks

| Path | Role |
|------|------|
| `components/steps/schedule-step.tsx` | Copy + composes `DateScrollRow` + `TimeSlotList` |
| `components/selectors/date-scroll-row.tsx` | Horizontal date selection |
| `components/selectors/time-slot-list.tsx` | Slot list (includes “full” slots) |
| `constants/time-slots.ts` | Slot definitions |
| `constants/pickup-addresses.ts` + `components/cards/address-option-card.tsx` | Address options from user profile |

### 3.7 Submission & success

- **API:** `pickupService.schedulePickup` → `orderService.create` (`src/services/pickupService.ts`).
- **Payload today:** `categoryIds`, `addressLine`, `scheduledAt` (photos are **not** sent yet — extend API/service when backend supports).
- **Success:** `PickupSuccessModal` (`components/scheduling/pickup-success-modal.tsx`); navigation to order detail via `router.replace(\`/order/${id}\`)`.

### 3.8 Deep link / prefill

`pickup-flow-screen` reads `categoryId` from `useLocalSearchParams` and merges into `draft.categoryIds` when valid. New entry params should follow the same pattern: parse in the screen, patch draft, avoid baking params into primitives.

---

## 4. Styling & design system rules (project-specific)

These align the brief with `ARCHITECTURE.md` and existing pickup screens:

1. **Use Tailwind / NativeWind `className`** for layout and theme — semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-secondary`, `bg-muted`, etc.
2. **Avoid raw hex / ad-hoc colors** in feature components; extend `tailwind.config.js` if a token is truly missing.
3. **Dark mode:** support `dark:` variants consistently with root layouts (see `PickupFlowScreen`, `PickupStepHeader`).
4. **Escape hatches:** `style={{ paddingTop: insets.top }}` and similar for safe-area / flex progress segments are **acceptable** where NativeWind does not express dynamic values; keep them **minimal and localized** (as in current `pickup-flow-screen.tsx` / `pickup-step-header.tsx`).
5. **Typography:** prefer `Text` `variant` props and shared classes; avoid one-off font arrays unless matching an existing step pattern.

---

## 5. UX principles (for scheduling enhancements)

- **Guided:** One primary action per screen (Continue / Confirm); header shows clear step index.
- **Minimal:** Short titles and subtitles per step; avoid cluttering review.
- **Operational clarity:** Date/slot/address summaries should scan quickly on review.
- **Low friction:** Sensible defaults (e.g. first available date/slot preselected on schedule step when entering that step).
- **Consistency:** New steps should mirror the same vertical rhythm (title → helper → content → footer button).

---

## 6. Architecture rules for new work

**Do**

- Add step UI under `src/features/pickup/components/steps/` or split `scheduling/` / `selectors/` / `cards/` as needed.
- Keep **constants** (`constants/`) and **pure helpers** (`lib/`) free of React when possible.
- Add **types** in `types/pickup-flow.ts` (or feature-local types) and thread through `PickupFlowDraft` when data is persisted across steps.
- Use **existing services**; extend `pickupService` / repositories when the backend contract grows (e.g. photo upload URLs).
- Prefer a **step registry** (map `stepId → component`) if conditional JSX in `pickup-flow-screen.tsx` grows — still feature-local.

**Do not**

- Import another feature from `features/pickup` (share via `@/components`, `@/services`, `@/types`).
- Move wizard-specific logic into `src/components/ui` primitives.
- Hardcode product strings inside primitives; keep copy in feature components or constants.
- Change global palette or root navigation structure for scheduling-only experiments.

---

## 7. Extension checklist (new scheduling step or field)

1. Extend `PickupFlowStepId` and `PICKUP_FLOW_STEP_IDS` order.
2. Extend `PickupFlowDraft` / `createEmptyPickupDraft` / `mergePickupDraft` if needed.
3. Update `canProceedPickupStep` for the new step (or new required fields).
4. Implement presentational step component; wire props from `pickup-flow-screen.tsx`.
5. Add defaults in `useEffect` only when necessary (pattern: schedule step prefill).
6. If submission payload changes, update `pickupService.schedulePickup` and domain types in `@/types/domain` / backend contract.
7. Update review formatters (`lib/review-formatters.ts`) and `ReviewStep` so the user sees the new data.

---

## 8. Known gaps (honest baseline)

- **Photos:** collected in draft but not sent on `schedulePickup` — document when integrating end-to-end uploads.
- **Addresses:** “Add new” is placeholder `Alert` — align with future profile/address API.
- **Errors:** schedule failure uses `Alert.alert`; consider centralized toast/snackbar if the app adds one — without introducing a second pattern lightly.

---

## 9. Summary

The pickup flow is already **feature-first**, **step-configured**, and **design-token aligned**. Enhancements should **extend** `pickup-flow-steps.ts`, `use-pickup-flow.ts`, and modular components under `features/pickup/components/**`, preserve **NativeWind semantic classes**, and keep routes and primitives thin — matching a production Expo app structured after Obytes-style separation already documented in this repo.
