# Phase 6: Deployment, Admin Dashboard, Revenue — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Phase 5 backend + mobile to production, launch minimal admin panel for dispute/user management, and activate revenue model (vet marketplace subscription + insurance commission tracking).

**Architecture:** Three independent deployments (backend on Cloud Functions, mobile on Expo EAS, vet dashboard on Vercel week 3+) with shared Firebase auth. Day-1 admin panel is read-only Firestore + dispute flags; full dashboard (analytics, payouts, chargeback) ships week 2. Revenue layer: vets pay Rp300-500K/mo (Xendit recurring invoice), owners free forever. Commission tracking via analytics events.

**Tech Stack:** Backend (Firebase Cloud Functions), Mobile (Expo EAS), Web (Next.js on Vercel), Admin (Next.js/Firestore), Auth (Firebase), Payments (Xendit), SMS (Twilio).

---

## Global Constraints

- Solo builder, 5-6 week MVP timeline
- Target: 10K owner + 100 vet pilots (Jakarta region)
- No breaking changes to Phase 5 APIs (payments, chat, health, vets, playdate)
- Production Xendit keys live day 1 (invoice creation, webhook handling)
- Admin panel internal-only (no user-facing invite flow)
- Owners free forever (no subscription paywall)
- Vets: recurring monthly invoice Rp300-500K/mo, auto-created on approval
- Commission: tracked in analytics, no manual payout ledger yet (manual reconciliation week 2)

---

## 1. Deployment Architecture

### 1.1 Backend (Cloud Functions)

**What:** Express app deployed to Firebase Cloud Functions.

**Setup:**
- Environment: `ENVIRONMENT=production`, `XENDIT_API_KEY=<live>`, `TWILIO_ACCOUNT_SID=<live>`, `TWILIO_AUTH_TOKEN=<live>`
- Firestore: same project as dev, live collections (users, vets, bookings, payments, health_records, playdates, chats, analytics)
- Firebase Auth: same project, production pool
- No code changes; `firebase deploy --only functions`

**Testing:** Run Jest suite against live functions (`npm test -- --testEnvironment=node`). E2E via mobile app (week 2).

---

### 1.2 Mobile (Expo EAS)

**What:** React Native app built and signed for iOS/Android, released to app stores.

**Setup:**
- Environment: `REACT_APP_API_BASE_URL=https://<production-backend-url>`, `REACT_APP_FIREBASE_PROJECT_ID=<live>`
- Expo EAS build: `eas build --platform ios --platform android --auto-submit`
- Auto-submit to TestFlight (iOS) + Google Play internal testing (Android)
- Manual review before public release (week 2)

**Testing:** Manual smoke test (signup → browse vets → book → chat). E2E Detox suite week 2.

---

### 1.3 Web Vet Dashboard (Week 3)

**What:** Next.js app (separate repo) for vets to manage bookings, view invoices, track payouts.

**Repo:** `/Users/ilham/Downloads/github/pet-care-vet-dashboard` (new)

**Stack:** Next.js 16, React 19, TypeScript, Tailwind, Firebase Admin SDK, Firestore queries.

**Scope week 3:** Vet login (Firebase auth), booking list (read Firestore), invoice view (Xendit API), payout ledger (analytics query). No edit operations.

**Deployment:** Vercel (auto-deploy from GitHub).

---

## 2. Revenue Model

### 2.1 Subscription: Vets Only

**Price:** Rp300-500K/mo (set per region/tier, hardcoded in backend for week 1).

**Trigger:** Admin approves vet in admin panel → backend auto-creates recurring Xendit invoice.

**Invoice lifecycle:**
1. Vet signup → `vets` collection: `status: 'pending'`, `subscription_id: null`
2. Admin approves (UI click) → backend POST `/admin/vet/:vetId/approve` → Xendit create recurring invoice → `vets.subscription_id = <xendit_invoice_id>`
3. Xendit invoice auto-sends via SMS/email
4. Vet pays → webhook updates `vets.subscription_status = 'active'` → vet dashboard unlocked
5. Month-end auto-renewal (Xendit handles)

**Owners:** Free forever, no paywall, no subscription logic.

---

### 2.2 Commission Tracking

**Insurance click:** Frontend fires analytics event `insurance_clicked` (existing). Backend logs to Firestore `insurance_clicks` collection: `{vetId, ownerId, timestamp, insurance_type}`.

**Commission reconciliation:** Week 2 admin tool queries `insurance_clicks`, manually calculates partner payouts (no auto-payout yet).

**Booking commission:** Owner pays vet via booking (Xendit invoice). Future (post-MVP): platform takes X% cut.

---

## 3. Minimal Admin Panel (Day 1)

### 3.1 Stack & Deployment

**Repo:** Separate Next.js app, integrated into `/pet-care-mobile-claude` as `/admin` subdirectory.

**Deployment:** Vercel, same domain as vet dashboard or subdomain `admin.<domain>`.

**Auth:** Firebase auth, `emailVerified=true` AND `custom.admin=true` claim. Manual claim setup in Firebase Console.

---

### 3.2 Day-1 Pages

**Users Page (`/admin/users`)**
- Search by name, phone, email (Firestore text index)
- Display: user ID, name, phone, bookings count, created_at, flagged (boolean)
- Action: checkbox to toggle `flagged` flag (writes to Firestore)
- No delete, no edit (write-only flag)

**Vets Page (`/admin/vets`)**
- Search by name, clinic (Firestore text index)
- Display: vet ID, name, clinic, rating, created_at, status (`pending`|`approved`|`blocked`)
- Action: dropdown to change status (pending → approved, approved ↔ blocked)
- Approve → auto-create Xendit invoice (backend call)
- Block → mark in Firestore, vet dashboard access revoked

**Payments Page (`/admin/payments`)**
- Read-only query: all invoices (Firestore `payments` collection)
- Display: invoice ID, vet name, amount, status, created_at, paid_at
- No refund UI (week 2)
- Filter by status (pending, paid, overdue)

**Disputes Page (`/admin/disputes`)**
- Query Firestore `disputes` collection (auto-created by flag actions)
- Display: dispute ID, user/vet involved, booking ID, reason, status
- Action: mark resolved (updates status, no email sent yet — week 2)

---

### 3.3 API Requirements (Backend)

**New routes (minimal):**

```
POST /admin/vet/:vetId/approve
  → Create Xendit recurring invoice
  → Update vets.status = 'approved', vets.subscription_id = <id>
  → Return { subscription_id, nextBillingDate }

POST /admin/vet/:vetId/block
  → Update vets.status = 'blocked'
  → Return { success: true }
```

All other admin operations (flag user, view payments, view disputes) = read-only Firestore queries from Next.js, no backend route needed.

---

## 4. Data Schema Changes

### 4.1 Firestore Collections (Additions)

**users** (existing, add field):
```json
{
  "uid": "...",
  "name": "...",
  "phone": "...",
  "flagged": false,
  "created_at": "2026-07-24T..."
}
```

**vets** (existing, add field):
```json
{
  "id": "...",
  "name": "...",
  "clinic": "...",
  "status": "pending|approved|blocked",
  "subscription_id": null,
  "subscription_status": "pending|active|overdue|cancelled",
  "created_at": "2026-07-24T...",
  "approved_at": null
}
```

**disputes** (new):
```json
{
  "id": "...",
  "type": "user_flagged|vet_flagged",
  "user_id": "...",
  "vet_id": "...",
  "booking_id": null,
  "reason": "...",
  "flagged_by": "admin_uid",
  "status": "open|resolved",
  "created_at": "2026-07-24T...",
  "resolved_at": null
}
```

**payments** (existing, no schema change — Xendit webhook updates status).

---

## 5. Testing

### 5.1 Backend

- Jest suite: run against deployed functions (`npm test -- --testEnvironment=node`)
- Manual: auth flow (signup, login), booking creation, Xendit webhook ingestion

### 5.2 Mobile

- Smoke: signup → browse vets → book → receive confirmation SMS
- E2E Detox (week 2): full user journey scripted

### 5.3 Admin Panel

- Manual: login → search users/vets → approve vet → verify Xendit invoice created
- Firestore rules: admin reads all collections (no restrictions)

---

## 6. Timeline & Milestones

**Week 1:** Backend deploy + mobile build. Admin panel core pages (users, vets, payments).
**Week 2:** Mobile public release. Admin: disputes, payouts reconciliation. E2E tests.
**Week 3:** Vet dashboard MVP (dashboard, invoices, payout ledger).
**Week 4-6:** Scaling, bug fixes, vet onboarding, owner feedback.

---

## 7. Known Gaps (Post-MVP)

- Vet payout ledger (manual week 1, auto-calculated week 2)
- Chargeback dispute resolution (manual email week 1)
- Subscription cancellation UI for vets (admin force-cancel only week 1)
- Multi-currency support (IDR only week 1)
- Detailed analytics dashboard (summary-only week 1)
