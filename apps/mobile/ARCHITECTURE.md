# Scrap-it — architecture

Production-oriented Expo (SDK 54) app: **Expo Router** under `src/app`, **feature-first** modules, **Tailwind via NativeWind v4** as the only styling system, and **mock data** behind service/repository boundaries.

---

## Folder rules

| Path | Purpose |
|------|---------|
| `src/app` | Expo Router **route files only**. No business logic, no direct `mock/` imports. Compose feature screens and wire navigation. |
| `src/features/<domain>` | Feature-owned UI sections, optional `hooks/`, feature-local types. **Do not import sibling features**; share via `@/components`, `@/lib`, `@/types`, `@/services`. |
| `src/components/ui` | Reusable primitives (Button, Text, Card, …). **Tailwind `className` only** for styling. No product copy that belongs in a feature. |
| `src/components/layout` | Shell pieces: headers, tab bar—presentational, reusable across features. |
| `src/mock` | Typed seeds and generators. **Never import from `src/app` directly**; consumed by repositories / services / API layer. |
| `src/services` | Domain facades used by features and hooks (`orderService.getById`, `pickupService.schedulePickup`, …). |
| `src/api` | Transport boundary: repository modules and future HTTP client. Mock implementations live here today. |
| `src/lib` | Pure utilities (`cn`, `delay`, storage keys). |
| `src/types` | Shared domain models when not colocated. |

Root config: `tailwind.config.js`, `metro.config.js`, `babel.config.js`, `nativewind-env.d.ts`, `ARCHITECTURE.md`.

---

## Naming conventions

- **Route files:** `kebab-case` for segments; dynamic routes `[id].tsx`.
- **Components:** `PascalCase` file name matching the primary export (`OrderCard.tsx`).
- **Hooks / services / utils:** `camelCase` files (`useOrders.ts`, `orderService.ts`, `formatDate.ts`).
- **Exports:** Prefer **named exports** for components and services. Use **default export** only for Expo route modules when required.

---

## Feature structure

Each feature follows:

```
src/features/<domain>/
  components/     # Feature-specific composites (optional)
  hooks/          # Calls services (optional)
  *-screen.tsx    # Or multiple screen entry components
  index.ts        # Optional barrel
```

Route files stay thin:

```tsx
// src/app/(app)/(tabs)/home.tsx
import { HomeScreen } from "@/features/home/home-screen";
export default function HomeRoute() {
  return <HomeScreen />;
}
```

---

## Component rules

- **Primitives** live in `src/components/ui` and accept `className` for composition.
- **Feature composites** live under `src/features/<domain>/components` (or next to the screen).
- Use **explicit props interfaces**; extend React Native props narrowly where needed.
- **No product constants or seeded rows inside presentational components**—pass data from containers, hooks, or services.

---

## Mock strategy

- All static and generated demo data lives in `src/mock/<entity>/` with typed exports.
- **Mutable demo state** (e.g. creating a new order) is centralized in `src/api/repositories` so behavior matches future persistence.
- `src/services/*` add artificial `delay()` where useful to mimic network latency.
- Replacing mocks: introduce an `HttpApiClient` (or per-entity HTTP adapters) that implements the same contracts the services already use—**avoid rewriting feature UI**.

---

## Styling conventions

- **Single source of truth:** `tailwind.config.js` + `src/global.css` (`@tailwind` layers).
- **Semantic utilities:** Prefer `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`, etc., over raw hex in JSX.
- **Dark mode:** `useColorScheme()` where needed; root screens may use `dark:` classes or neutral backgrounds (see `Screen`). Prefer **system** behavior to match `app.json` `userInterfaceStyle: "automatic"`.
- **Spacing & radius:** Use the Tailwind scale and extended radii (`rounded-2xl`, …).
- **Escape hatches:** Avoid `StyleSheet.create` unless NativeWind cannot express the style; document new exceptions here if they are added.
- **Fonts:** Plus Jakarta Sans loaded in `src/app/_layout.tsx`; `font-sans` / `font-semibold` / `font-bold` in `tailwind.config.js` map to loaded font names.

---

## Navigation overview

- `/` — Splash / bootstrap (session + onboarding flags).
- `/onboarding`, `/login` — Auth group (not authenticated).
- `/home`, `/orders`, `/profile` — Main tabs.
- `/pickup` — Schedule flow (modal stack).
- `/order/[id]` — Order detail / tracking placeholder.

---

## References

- Product UX reference: sibling `reference - app` (Next.js)—behaviors recreated here with RN + NativeWind only.
- Structural alignment: [Obytes React Native template](https://github.com/obytes/react-native-template-obytes) (`src/app`, `src/features`, `src/components/ui`).

## Typed routes

`app.json` currently sets `experiments.typedRoutes` to **false** so `router.replace("/home")` and similar calls typecheck without a generated `.expo/types/router.d.ts`. After a local `npx expo start`, you can turn `typedRoutes` back on and commit the regenerated types if you want stricter href checking.
