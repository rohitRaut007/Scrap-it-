# SCRAP-IT — MASTER PRODUCT & BUSINESS PLAN
### The Operating System for India's Scrap Economy
*Final version — June 2026*

---

## PART 1 — WHAT WE ARE BUILDING AND WHY

### The One-Line Vision
Scrap-it is the platform that gives every kabadiwala a business, and every household a reliable, fairly-priced scrap pickup — without anyone needing to wait on the street or haggle.

### The Business Model (Simple Version)
```
Household has scrap → Books pickup on app → Nearest collector gets the order
Collector arrives → Weighs material → Pays customer at transparent platform rate
Platform earns 6–8% of transaction value → Collector earns more → Customer trusts price → Repeat
```

### Why This Model Wins Over Others
- You are not an operations company (you don't dispatch, don't handle logistics)
- You are not a classifieds board (you stay in the transaction loop via pricing + ratings)
- Collectors use your tools daily for free → you own their workflow → leads flow naturally from within that workflow
- Customers trust transparent pricing → they never need to haggle → they come back
- **The moat is data** — pricing intelligence, collector ratings, customer demand patterns — none of which a WhatsApp group can replicate

---

## PART 2 — THE PRODUCT ARCHITECTURE (Two-Sided Platform)

```
┌─────────────────────────────────────────────────────┐
│                  SCRAP-IT PLATFORM                  │
├──────────────────────┬──────────────────────────────┤
│   CUSTOMER SIDE      │      COLLECTOR SIDE           │
│   (Mobile App)       │   (Collector App/Portal)      │
│                      │                               │
│ • Book pickup        │ • See incoming leads           │
│ • See live rates     │ • Manage their schedule        │
│ • Track collector    │ • Log weight + earnings        │
│ • Rate collector     │ • Track daily/weekly income    │
│ • View history       │ • See live scrap rates         │
│ • Get paid           │ • Build their reputation       │
│                      │ • Rate customers               │
└──────────────────────┴──────────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │    ADMIN PORTAL     │
              │ • Order oversight   │
              │ • Pricing control   │
              │ • Collector mgmt    │
              │ • Business metrics  │
              └────────────────────┘
```

---

## PART 3 — THE FEEDBACK & RATING SYSTEM (Critical Trust Layer)

This is what separates Scrap-it from a WhatsApp group. Both sides rate each other. Both are accountable.

### How It Works

After every completed pickup — both sides get a rating prompt (24-hour window).

**Customer rates Collector (5-star):**

| Dimension | What it measures |
|-----------|-----------------|
| Punctuality | Did he arrive at the confirmed time? |
| Fair Pricing | Did he pay the platform-listed rate? |
| Behavior | Was he respectful, professional? |
| Cleanliness | Did he clean up after the pickup? |

**Collector rates Customer (5-star):**

| Dimension | What it measures |
|-----------|-----------------|
| Material Accuracy | Was the scrap as described in the booking? |
| Availability | Was the customer home at the agreed time? |
| Easy to Locate | Was the address accurate and findable? |
| Volume Accuracy | Was the approximate weight close to actual? |

### Why Bidirectional Ratings Matter

When a collector knows the customer will rate him, he arrives on time and pays fairly. When a customer knows the collector will rate her, she doesn't waste his trip with inaccurate descriptions. Both sides perform better because both are accountable. This is exactly why Uber works — not the GPS, the mutual rating.

### Rating Rules
- Ratings are visible on both profiles after minimum 5 completed pickups
- Collectors with below 3.8 stars get fewer leads routed to them (soft penalty, no ban)
- Customers with below 3.5 stars get a "confirmation required" flag (collector can decline)
- Collector can publicly respond to any rating (like Google Reviews)
- Customer can flag a collector for dispute (wrong pricing, no-show) — goes to admin

### Collector Rating Tiers

| Rating Tier | Badge | Benefit |
|------------|-------|---------|
| 4.8+ with 50+ pickups | Verified Pro | Priority in order routing, featured in area listings |
| 4.5+ with 25+ pickups | Trusted Collector | Green badge on profile, higher booking rate |
| 4.0–4.5 | Active Collector | Standard routing |
| Below 3.8 | Needs Improvement | Private warning, fewer leads |

This is your quality control layer without any operations team.

---

## PART 4 — THE COLLECTOR REFERRAL LOOP (Making Them Push the App)

### The Problem to Solve
After the first booking, customer has collector's phone number. She calls him directly next time. Platform gets bypassed. This kills the business.

### The Mechanism: Collector's Personal QR + Deep Link

Every collector gets a unique, permanent booking link:
```
scrapit.app/book/raju-kabadiwala-pune
```
And a QR code card (printed, WhatsApp shareable) that opens the app pre-configured to book with that specific collector.

When a customer books through this link, the order is automatically assigned to that collector — guaranteed. He doesn't enter a pool and wait to be matched. The booking is HIS.

### Why the Collector Will Actively Push This

**Scenario A — Customer calls directly:**
- Collector talks, confirms time, goes for pickup
- Weight logged manually (or not at all)
- No review earned
- No earnings history on platform
- No referral credit
- Customer might not be home, no accountability

**Scenario B — Customer books through app using his link:**
- Collector sees order in app: customer photo of scrap, exact address, pre-confirmed time
- He knows what to expect before he arrives (no surprise "actually I only have 2 newspapers")
- Weight logged automatically → earnings tracked
- Review earned toward his Verified Pro badge
- Customer gets automated reminders so she's actually home
- Collector earns more, wastes less time, builds his reputation

### The Script (What Collector Says to Returning Customers)

> *"Haan zaroor aaunga. Ek kaam karo — iss QR code ko scan karo aur wahan book karo. Isse tumhe pehle se rate pata rahega, aur mujhe bhi exact time milega. Bahut easy hai, 30 second mein ho jaata hai."*

He's not saying "download an app." He's saying "scan this, you'll know your rate before I arrive." The customer benefit is front and center.

### The Printed QR Card (Give Every Onboarded Collector)

```
┌─────────────────────────────────┐
│  [Collector Name] — Scrap Pickup│
│  Fast • Fair Price • On Time    │
│                                 │
│  Scan to book your pickup →     │
│         [QR CODE]               │
│                                 │
│  scrapit.app/book/[name]        │
│  WhatsApp: [number]             │
└─────────────────────────────────┘
```

### Collector Gamification
- Every 10 app bookings = +1 trust score point
- Top collectors in each area featured in "Trusted in your area" section of customer home screen
- Monthly leaderboard: "Most pickups this month" — recognition builds community loyalty
- Verified Pro collectors can set their own availability windows — more control = more loyalty

---

## PART 5 — COMPLETE FEATURE MAP

### Customer App (Mobile)

| Feature | Status | Priority |
|---------|--------|----------|
| Onboarding + Auth | ✅ Done | — |
| Home dashboard | ✅ Done | — |
| 5-step pickup booking | ✅ Done | — |
| Orders list + history | ✅ Done | — |
| Address management | ✅ Done | — |
| Profile management | ✅ Done | — |
| Live scrap rates display | ❌ Not built | P0 |
| Order cancellation button | ❌ Not built | P0 |
| Rate collector (post-pickup) | ❌ Not built | P0 |
| Payout status (₹ earned) | ❌ Not built | P1 |
| Live collector tracking (map) | ⚠️ Partial | P2 |
| Share collector QR / refer friend | ❌ Not built | P2 |

### Collector Portal (`apps/collector` — live at port 3004)

| Feature | Status | Priority |
|---------|--------|----------|
| Collector login + profile setup | ✅ Done | — |
| Incoming orders feed | ✅ Done | — |
| Accept / Decline order | ✅ Done (race-safe claim) | — |
| Update order status (en route → arriving → completed) | ✅ Done | — |
| Log pickup weight + category (payout auto-calculated) | ✅ Done | — |
| Daily earnings summary | ✅ Done | — |
| Weekly/monthly earnings chart | ✅ Done (14-day chart + totals) | — |
| Personal QR code + booking link | ✅ Done (QR + copy/WhatsApp share) | — |
| Rate customer (post-pickup) | ❌ Not built | P0 |
| Live scrap rates | ⚠️ Partial (rates shown per order) | P1 |
| Area filter on orders feed | ❌ Not built (feed shows all cities) | P1 |
| Route planner (area map) | ❌ Not built | P2 |
| Customer history + notes | ❌ Not built | P2 |
| WhatsApp template messages | ⚠️ Partial (wa.me link per order) | P2 |

### Admin Portal

| Feature | Status | Priority |
|---------|--------|----------|
| Dashboard stats | ✅ Done | — |
| Orders list + filter | ✅ Done | — |
| Order detail + status updates | ✅ Done | — |
| Collector assignment | ✅ Done | — |
| Collector list | ✅ Done | — |
| Add/edit collector | ❌ Not built | P0 |
| Category pricing management | ❌ Not built | P0 |
| Rating/dispute resolution | ❌ Not built | P1 |
| Revenue analytics | ❌ Not built | P1 |
| Service area management | ❌ Not built | P2 |

---

## PART 6 — PRIORITIZED BUILD ROADMAP

### Sprint 0 — Close the Loop (Weeks 1–2)
**Goal: First real pickup with real payout happens**

1. Add `baseRateInr` to Category in DB + update seed with real market rates
2. Pricing calculation on order completion (weight × rate = payout)
3. Order cancellation UI in mobile app
4. Admin: Add collector form (so you can onboard first collector without Prisma Studio)
5. Admin: Category rate management (update rates without a DB migration)

**End state:** A customer books, collector completes, ₹ amount is calculated and shown. Loop closed.

---

### Sprint 1 — The Feedback Layer (Weeks 3–4)
**Goal: Both parties are accountable. Trust infrastructure exists.**

1. Post-pickup rating prompt in customer app (rate collector, 5-star + comment)
2. Post-pickup rating prompt in collector portal (rate customer)
3. Rating display on collector profile
4. Rating display on customer profile (visible to collector when accepting order)
5. Admin: Flag/dispute flow for low ratings

**End state:** Every pickup leaves a trail of accountability. Quality improves automatically.

---

### Sprint 2 — Collector Portal MVP (Weeks 5–7)
**Goal: Collector manages their own orders without admin intervention**

1. Collector login (role-based, separate from admin)
2. Incoming orders feed for their registered area
3. Accept / decline order
4. Status updates: en route → arriving → completed
5. Weight logging at completion (triggers payout calculation)
6. Daily earnings dashboard (today, this week, this month)
7. Personal QR code + booking link generation

**End state:** Admin portal stops being a dispatch center. Collectors self-manage. You stop being an operations person.

---

### Sprint 3 — Live Rates + Notifications (Weeks 8–9)
**Goal: Daily engagement for collectors. Trust for customers.**

1. Live scrap rates module (admin updates daily, or mandi price API later)
2. Rate display in customer home screen ("Today: Newspaper ₹14/kg, Copper ₹380/kg")
3. WhatsApp notifications via AiSensy:
   - "Your collector is on the way" (en route trigger)
   - "Pickup completed. You earned ₹X today" (completed trigger)
4. Push notifications (FCM) for order status changes

**End state:** Collector opens app daily to check rates. Customer gets WhatsApp confirmation. Both engaged without manual effort.

---

### Sprint 4 — Payout Integration (Weeks 10–12)
**Goal: Real money moves through the platform**

1. Razorpay Payout API integration
2. `Payout` model in DB (orderId, amount, status, razorpayId)
3. Admin "Release payout" action in order detail
4. Customer payout status in order history and profile
5. Collector earnings marked as "paid" vs "pending"

**End state:** Customers get UPI transfers. Business model is live. This is the moment Scrap-it becomes a real company.

---

### Sprint 5 — Live Tracking + Intelligence (Weeks 13–16)
**Goal: Premium product experience. The "Swiggy moment."**

1. Collector location updates every 30s when order is active
2. Customer sees live map in order detail screen
3. ETA calculation
4. Area demand heatmap in admin (which areas have most demand)
5. Collector route optimizer (arrange day's orders in optimal sequence)

---

## PART 7 — COMPLETE USER JOURNEY MAPS

### Customer Journey
```
Sign up → Set address → Book pickup (select items, upload photo, choose slot)
→ See collector profile + ratings before confirming
→ Get WhatsApp confirmation
→ Track collector on map
→ Receive payment
→ Rate collector
→ See earnings history
```

### Collector Journey
```
Sign up → Set service area + availability
→ See incoming orders in their area
→ Accept order → Get customer details + scrap photo
→ Update status as they go
→ Log weight at completion
→ See earnings auto-calculated
→ Rate customer
→ Share QR code to bring customers to app
→ Build rating + reputation over time
```

### Admin Journey
```
Onboard collectors → Set pricing per category
→ Monitor order flow (exception-based, not every order)
→ Handle disputes from ratings
→ Review daily revenue + collector performance
→ Adjust pricing based on demand/supply
→ Service area expansion decisions
```

---

## PART 8 — MONETIZATION STRUCTURE

| Phase | Revenue Source | Amount |
|-------|---------------|--------|
| Launch (Month 1–3) | Zero — prove the loop first | ₹0 |
| Early (Month 4–6) | Platform fee: 6% of transaction value | ₹30–90 per order |
| Growth (Month 7–12) | Platform fee + Verified Pro badge (₹199/month, optional) | Above + subscription |
| Scale (Year 2) | Data products: scrap price index, demand forecasting for aggregators | B2B SaaS |

Do not charge anything in the first 3 months. Build the behavior first, then monetize the behavior.

---

## PART 9 — FIRST 30 DAYS IN THE REAL WORLD

### Manual Operations While Sprints Are In Progress

| Day | Action |
|-----|--------|
| 1–3 | Find first collector (in-person approach) |
| 4–5 | Find 10 pilot households willing to give scrap for a free pickup |
| 6 | First pickup — manual coordination, no app needed |
| 7 | Debrief collector + customers. Fix what broke. |
| 8–10 | Run 2 more pickups. Build trust. |
| 11–14 | Introduce the app: "Main yeh sab ek app mein kar raha hoon. Kya aap try karoge?" |
| 14–20 | Onboard collector to the collector portal (Sprint 2 should be live) |
| 20–30 | Collector is managing their own orders. You are only monitoring. |

### Collector Daily Schedule (Build Features Around This)

| Time | What they're doing | Product implication |
|------|-------------------|---------------------|
| 6:00–7:00 AM | Load vehicle, plan route | No app engagement expected |
| 7:30–11:30 AM | Active pickup rounds | No screen time — do not push notifications here |
| 11:30 AM–2:30 PM | Sell to aggregator + rest | **Primary engagement window** |
| 3:00–5:30 PM | Second pickup round | No screen time |
| 5:30–7:00 PM | Final sell + count earnings | Good time for earnings summary notification |
| 7:00–9:00 PM | Home, relaxed | **Secondary engagement window** — show next day's orders |

### What Tools Collectors Use Today (And What to Replace)

| Current tool | What they use it for | Scrap-it replacement |
|-------------|---------------------|---------------------|
| Phone call log | Their entire CRM | Customer history + notes in app |
| Physical notebook | Weight logs, earnings | Weight logger + earnings dashboard |
| Calculator app | Weight × rate math | Auto-calculation at weight log |
| WhatsApp | Customer communication | WhatsApp template messages from app |
| Memory / head | Route planning | Route planner + pre-confirmed order list |
| Nothing | Scrap rate awareness | Live rates feed (daily) |

---

## PART 10 — PRODUCT PRINCIPLES (Non-Negotiable)

1. **Transparency over confusion** — Customers always see the rate before booking. No surprise pricing.

2. **Collector first** — If a feature creates friction for the collector, it doesn't ship. They are the supply side. Without them there is no product.

3. **Every transaction is tracked** — No off-platform deals. The QR code, the app booking, the weight log — every step creates data. Data is the real asset.

4. **Both sides are accountable** — Ratings are not optional. Not leaving a rating is the exception. The platform is safe because both sides know they will be rated.

5. **WhatsApp is the notification layer** — Do not assume customers will check the app for updates. Send every critical update to WhatsApp. The app is for booking and history. WhatsApp is for real-time.

6. **Mobile-first, lite data** — A significant portion of collectors and customers are on 4G with limited data. Every screen must load under 3G conditions. No heavy animations.

---

## PART 11 — CURRENT BUILD STATUS SUMMARY

### What Is Done
- ✅ Customer mobile app (~90% complete)
- ✅ Backend API (auth, orders, categories, addresses, uploads, admin + collector endpoints)
- ✅ Admin portal (order management, assignment, stats)
- ✅ Collector portal (self-service: accept → status updates → weigh & complete → earnings) — *July 2026*
- ✅ Pricing engine (Category.baseRateInr × logged weight = payout, rate snapshot frozen per order) — *July 2026*
- ✅ Personal QR code + booking link per collector — *July 2026*
- ✅ Database schema (solid Prisma foundation)

### What Is Needed Next (Ordered by Impact)
1. Cancellation UI in mobile
2. Add collector form in admin portal
3. Post-pickup rating system (both sides)
4. Live scrap rates display (customer home + collector dashboard)
5. `scrapit.app/book/<slug>` public booking page (QR links exist; landing page doesn't yet)
6. WhatsApp notifications (AiSensy)
7. Razorpay payout integration
8. Live GPS tracking

---

*The product is real. The market is real. The gap between where you are and a live working business is 6–8 weeks of focused building.*
