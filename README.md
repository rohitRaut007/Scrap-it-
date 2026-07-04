# Scrap-it

Scrap waste pickup logistics app for India. Customers schedule scrap pickups; collectors fulfill them. Built as a **pnpm + Turborepo monorepo**.

---

## Project Structure

```
Scrap-it/
├── apps/
│   ├── backend/      # NestJS REST API (port 3001)
│   ├── mobile/       # Expo React Native customer app
│   └── admin/        # Next.js admin dashboard (port 3003)
├── packages/
│   ├── types/        # Shared TypeScript types & enums
│   ├── constants/    # Shared runtime constants
│   ├── api-client/   # Typed fetch client
│   ├── tsconfig/     # Shared TS configs
│   └── eslint-config/# Shared ESLint config
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Prerequisites

Make sure you have these installed before anything else:

| Tool | Version | Install command |
|------|---------|-----------------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 9.15.9 | `npm install -g pnpm@9.15.9` |

You also need accounts for:
- **Supabase** — database + auth → https://supabase.com
- **Cloudflare R2** — photo uploads → https://cloudflare.com
- **Google Maps** — maps in mobile app → https://console.cloud.google.com

---

## Step 1 — Install Dependencies

Run this once from the repo root. It installs everything for all apps and packages.

```bash
pnpm install
```

---

## Step 2 — Set Up Environment Variables

### Backend — `apps/backend/.env`

```bash
cp apps/backend/.env.example apps/backend/.env
```

Open `apps/backend/.env` and fill in:

```env
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3003

# Supabase — Project Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=get_from_supabase_dashboard_settings_api
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Postgres — Project Settings → Database
# Use port 6543 (pooled) for DATABASE_URL and port 5432 (direct) for DIRECT_URL
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Cloudflare R2 — for order photo uploads
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=order-photos
```

**Where to find each value:**
- `SUPABASE_URL` + `SUPABASE_JWT_SECRET` → Supabase dashboard → Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase dashboard → Project Settings → API → `service_role` key
- `DATABASE_URL` / `DIRECT_URL` → Supabase dashboard → Project Settings → Database → Connection string
- `R2_*` → Cloudflare dashboard → R2 → Create bucket → Manage API Tokens

---

### Mobile — `apps/mobile/.env`

Create the file manually:

```bash
# Create the file
touch apps/mobile/.env
```

Add this content (or copy from `apps/mobile/.env.example` if it exists):

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Supabase (same project as backend)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL — change depending on where you are running
# iOS Simulator / Web browser:  http://localhost:3001
# Android Emulator:             http://10.0.2.2:3001
# Physical device (your phone): http://<your-machine-LAN-ip>:3001
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

---

### Admin — `apps/admin/.env.local`

Create the file manually:

```bash
touch apps/admin/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Step 3 — Set Up the Database

Run this once to create all tables in your Supabase Postgres database:

```bash
pnpm --filter @scrap-it/backend prisma:migrate
```

To seed initial data (categories, etc.):

```bash
pnpm --filter @scrap-it/backend prisma:seed
```

---

## Step 4 — Start the Project

### Option A — Start Everything at Once (recommended)

```bash
pnpm dev
```

This starts all three apps in parallel:
- **Backend** → `http://localhost:3001`
- **Admin** → `http://localhost:3003`
- **Mobile** → Expo dev server (scan QR code with Expo Go app)

---

### Option B — Start Each App Individually

#### Backend (NestJS API)

```bash
pnpm --filter @scrap-it/backend dev
```

Runs on `http://localhost:3001`. Test it: `GET http://localhost:3001/health`

#### Admin Dashboard (Next.js)

```bash
pnpm --filter @scrap-it/admin dev
```

Open `http://localhost:3003` in your browser.

#### Mobile App (Expo)

```bash
pnpm --filter @scrap-it/mobile dev
```

Once the QR code appears:
- Press `i` → iOS Simulator
- Press `a` → Android Emulator
- Press `w` → Web browser
- Scan the QR code with **Expo Go** on your phone

For a fresh start (clears Metro cache):

```bash
pnpm --filter @scrap-it/mobile start:clean
```

---

## All Commands Reference

### Root (run from repo root)

| Command | What it does |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm format` | Format all files with Prettier |

### Backend

| Command | What it does |
|---------|-------------|
| `pnpm --filter @scrap-it/backend dev` | Start API in watch mode (hot reload) |
| `pnpm --filter @scrap-it/backend build` | Build for production |
| `pnpm --filter @scrap-it/backend start` | Start production build |
| `pnpm --filter @scrap-it/backend prisma:generate` | Regenerate Prisma client after schema change |
| `pnpm --filter @scrap-it/backend prisma:migrate` | Run DB migrations |
| `pnpm --filter @scrap-it/backend prisma:seed` | Seed the database |
| `pnpm --filter @scrap-it/backend lint` | Lint backend code |

### Admin

| Command | What it does |
|---------|-------------|
| `pnpm --filter @scrap-it/admin dev` | Start admin dashboard (port 3003) |
| `pnpm --filter @scrap-it/admin build` | Build for production |
| `pnpm --filter @scrap-it/admin start` | Start production build |
| `pnpm --filter @scrap-it/admin lint` | Lint admin code |

### Mobile

| Command | What it does |
|---------|-------------|
| `pnpm --filter @scrap-it/mobile dev` | Start Expo dev server |
| `pnpm --filter @scrap-it/mobile android` | Run on Android device/emulator |
| `pnpm --filter @scrap-it/mobile ios` | Run on iOS simulator |
| `pnpm --filter @scrap-it/mobile web` | Run in browser |
| `pnpm --filter @scrap-it/mobile start:clean` | Start with cleared Metro cache |
| `pnpm --filter @scrap-it/mobile clean` | Clean all Expo/Metro caches |

---

## Backend API — Key Endpoints

Base URL: `http://localhost:3001`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/categories` | Yes | List waste categories |
| GET | `/orders` | Yes | List my pickup orders |
| POST | `/orders` | Yes | Create a pickup order |
| PATCH | `/orders/:id/cancel` | Yes | Cancel an order |
| GET | `/users/me/addresses` | Yes | List my saved addresses |
| POST | `/users/me/addresses` | Yes | Add a new address |
| POST | `/uploads/order-photo` | Yes | Get presigned R2 upload URL |

Auth = send Supabase JWT in `Authorization: Bearer <token>` header.

---

## Database — Browse with Prisma Studio

```bash
cd apps/backend
npx prisma studio
```

Opens a visual database browser at `http://localhost:5555`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | Expo (React Native), NativeWind, Expo Router |
| Backend API | NestJS, Prisma ORM, PostgreSQL |
| Admin dashboard | Next.js 15, shadcn/ui, Tailwind CSS |
| Auth | Supabase Auth (JWT) |
| Database | Supabase PostgreSQL |
| File storage | Cloudflare R2 (S3-compatible) |
| Maps | Google Maps (react-native-maps) |
| Monorepo tooling | pnpm workspaces + Turborepo |

---

## Troubleshooting

**`pnpm: command not found`**
```bash
npm install -g pnpm@9.15.9
```

**Backend fails to start with `DATABASE_URL` error**
Make sure `apps/backend/.env` exists and has valid Supabase DB connection strings.

**Prisma migration fails**
Make sure `DIRECT_URL` uses port `5432` (direct connection), not `6543` (pooled). Migrations need a direct connection.

**Mobile can't reach the backend on a physical device**
Set `EXPO_PUBLIC_API_BASE_URL=http://<your-LAN-ip>:3001` (find your LAN IP with `ipconfig` on Windows or `ifconfig` on Mac/Linux).

**Android emulator can't reach localhost**
Use `http://10.0.2.2:3001` instead of `http://localhost:3001`.

**`@scrap-it/types` or other workspace packages not found**
Run `pnpm install` from the repo root to rebuild workspace symlinks.

**Expo QR code not scanning**
Make sure your phone and computer are on the same Wi-Fi network.
