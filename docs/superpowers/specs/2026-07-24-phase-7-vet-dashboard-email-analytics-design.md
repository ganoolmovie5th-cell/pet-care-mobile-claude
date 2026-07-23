# Phase 7: Vet Dashboard, Email Notifications, Analytics — Design Spec

**Date:** July 24, 2026
**Status:** Approved
**Timeline:** Week 3-4 (after Phase 6 launch)
**Solo Builder:** Yes

---

## Executive Summary

Phase 7 ships three features enabling vets to self-serve (dashboard), owners to receive transactional confirmations (email), and admins to track platform health (analytics). Vet dashboard parallels admin panel architecture. Email uses SendGrid. Analytics pipeline flows Firestore → BigQuery nightly.

**Success Criteria:**
- Vet dashboard: 100% engagement from 20 approved vets day 1
- Email delivery: > 98% success rate
- Analytics: DAU > 50, ARPU > Rp10K, churn < 5%

---

## Architecture Overview

### 1. Backend (Cloud Functions)

**New Endpoints:**

```
GET /vet/:vetId/dashboard
  Returns: { earnings_month, total_earnings_lifetime, subscription_status, next_billing_date, booking_count }
  Auth: Firebase token (vet-only claim, or self-referential check)

GET /vet/:vetId/bookings?limit=20&offset=0
  Returns: [ { booking_id, owner_name, pet_name, date, status, amount, owner_phone } ]
  Firestore query: bookings where vet_id=:vetId, order by date DESC

POST /analytics/event
  Body: { userId, eventType, timestamp, metadata }
  Stores to: analytics_events collection
  Triggers: Cloud Task → SendGrid (for transactional emails)
  Auth: Any authenticated user

POST /email/send (internal)
  Body: { template, recipient, variables }
  Calls: SendGrid API
  Returns: { messageId, status }
  Auth: Cloud Functions service account only
```

**Email Templates** (stored in Firestore: `email_templates/{template_id}`):

1. `booking_confirmed` → Owner + Vet
   - Subject: "Booking confirmed: {pet_name} with {vet_name}"
   - Variables: owner_name, vet_name, pet_name, date, time, price
   - Trigger: booking.status = 'confirmed'

2. `payment_received` → Owner + Vet
   - Subject: "Payment received - {amount}"
   - Variables: owner_name, amount, booking_id, receipt_url
   - Trigger: payment.status = 'completed'

3. `vet_subscription_reminder` → Vet
   - Subject: "Your subscription renews on {date}"
   - Variables: vet_name, renewal_date, amount, manage_url
   - Trigger: Firestore scheduled function (day 1 and day 25 of month)

4. `vet_subscription_overdue` → Vet
   - Subject: "Payment overdue - please update billing"
   - Variables: vet_name, due_date, manage_url
   - Trigger: subscription_status = 'overdue' (webhook from Xendit)

### 2. Vet Dashboard (Next.js Web App)

**Architecture:** Same pattern as admin panel (separate Next.js 16 app, deployed Vercel).

**Directory:** `vet-dashboard/` (subdirectory in pet-care-mobile-claude)

**Pages:**

1. `/login` — Firebase email/password auth
   - Checks custom claim: `vet` (boolean)
   - Non-vets → redirect /login, show "not a vet" error
   - Successful login → redirect /bookings

2. `/bookings` — List upcoming + past bookings
   - Search: by owner phone or pet name
   - Filter: status (upcoming, completed, cancelled)
   - Columns: date, owner, pet, price, status
   - Click → detail modal (owner contact, pet notes, payment status)

3. `/earnings` — Monthly revenue dashboard
   - Card: "This Month: Rp{amount}"
   - Card: "Lifetime: Rp{total}"
   - Card: "Subscription: {status} (renews {date})"
   - Table: Last 6 months breakdown (month, bookings, revenue, commission_taken)
   - Download: CSV export

4. `/support` — FAQ + contact
   - FAQ: Common questions (how to withdraw, when invoiced, cancellation)
   - Contact form: Subject + message → support@petcare.com
   - Email confirmation: "We'll reply within 24h"

5. `/settings` — Account info (read-only for MVP)
   - Clinic name, email, phone
   - Link: "Update info" → message admin
   - Button: Logout

**Tech Stack:**
- Next.js 16, React 19, TypeScript strict
- Firebase Auth (email/password), custom vet claim gate
- Firestore real-time queries (bookings, earnings)
- Tailwind CSS
- Deployed: Vercel (CI/CD on push)

### 3. Mobile (React Native)

**Analytics Event Tracking:**

Track 5 critical events:
- `app_opened` → daily active user (DAU)
- `booking_created` → funnel metric
- `payment_completed` → revenue tracking
- `vet_viewed` → engagement
- `dispute_opened` → quality issues

**Push Notifications:**

Firebase Cloud Messaging (FCM) for:
- Booking confirmation (owner receives)
- Vet approval notification (vet receives)
- Payment receipt (owner receives)
- Booking reminder (owner, 1 day before)

### 4. Analytics Pipeline

**Event Collection:**
- POST /analytics/event → Firestore `analytics_events/{eventId}`

**Data Warehouse:**
- Nightly Cloud Function: Export analytics_events → BigQuery table
- BigQuery table: `analytics.events` (partitioned by date)

**Dashboard (Data Studio):**
- DAU (distinct userId per day, line chart)
- Bookings per day (bar chart)
- Revenue per day (line chart)
- ARPU (revenue / DAU)
- Cohort retention (% of day-0 users active on day-7, day-30)

---

## Data Model

### Firestore Collections (New/Modified)

**`analytics_events/{eventId}`**
```
{
  userId: string,
  eventType: 'app_opened' | 'booking_created' | 'payment_completed' | 'vet_viewed' | 'dispute_opened',
  timestamp: ISO8601,
  metadata: { bookingId?, vetId?, amount?, ... }
}
```

**`vet_earnings/{vetId}/monthly/{YYYY-MM}`**
```
{
  month: 'YYYY-MM',
  total_revenue: number (Rp),
  booking_count: number,
  commission_paid: number (Rp),
  updated_at: ISO8601,
}
```

**`vets/{vetId}` (add fields)**
```
{
  fcm_tokens: string[],
  email_preferences: {
    booking_notifications: boolean,
    payment_notifications: boolean,
    subscription_reminders: boolean,
  }
}
```

**`email_templates/{templateId}`**
```
{
  template_id: 'booking_confirmed' | 'payment_received' | 'vet_subscription_reminder' | 'vet_subscription_overdue',
  subject: string,
  body_html: string,
  variables: string[],
  created_at: ISO8601,
}
```

---

## Services & External Dependencies

### SendGrid

**Setup:**
- API key stored in Cloud Functions env (`SENDGRID_API_KEY`)
- Rate limit: 100 emails/sec

### Firebase Cloud Messaging (FCM)

**Setup:**
- Android: google-services.json (existing)
- iOS: GoogleService-Info.plist (existing)
- Expo EAS: `expo-notifications` plugin (already added)

### BigQuery

**Setup:**
- Dataset: `analytics` (in pet-care-prod project)
- Nightly job: Export analytics_events → BigQuery

---

## Error Handling & Resilience

**Email failure:**
- SendGrid down → retry via Cloud Tasks (exponential backoff)
- Invalid email → log, skip

**FCM failure:**
- Token invalid → remove from users.fcm_tokens
- Firebase down → fallback to email

**Analytics loss:**
- POST /analytics/event fails → retry via offline queue
- BigQuery sync fails → manual re-run

---

## Security & Privacy

**Firestore Rules (New):**
```
match /analytics_events/{eventId} {
  allow write: if request.auth != null;
  allow read: if request.auth.token.admin == true;
}

match /vet_earnings/{vetId}/{document=**} {
  allow read: if request.auth.uid == [vet_id_from_custom_claim]
    || request.auth.token.admin == true;
}
```

---

## Testing Strategy

**Backend:**
- Unit tests: email template rendering, earnings calculation
- Integration tests: POST /analytics/event → Firestore write
- E2E: booking created → email sent

**Frontend (Vet Dashboard):**
- Component tests: bookings table, earnings card
- E2E: Login → view bookings → see earnings

**Mobile:**
- Unit: analytics event structure
- E2E: app open → trackEvent() → BigQuery appears

**Analytics:**
- Validation: sample event → BigQuery within 24h

---

## Deployment & Rollout

**Phase 7a (Day 1):**
1. Deploy backend endpoints (1h)
2. Deploy vet dashboard to Vercel (1h)
3. Test email sends (30 min)
4. Enable event tracking in mobile (new EAS build)

**Phase 7b (Day 2):**
1. Turn on FCM notifications
2. Deploy BigQuery sync job
3. Publish Data Studio dashboard
4. Smoke test: booking → email → vet sees in dashboard

**Phase 7c (Week 2):**
1. Monitor email metrics
2. Analyze DAU/ARPU/churn
3. Iterate on UX

---

## Known Limitations (MVP)

1. No bulk email — send 1 email per event
2. No email unsubscribe — all vets subscribed
3. No vet earnings withdraw — display only
4. No analytics drill-down — read-only dashboard
5. No SMS — email + push only

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Vet dashboard engagement | 100% of 20 vets login within 3 days |
| Email delivery rate | > 98% success |
| DAU (Day 7) | > 50 users |
| ARPU (Week 1) | > Rp10,000 |
| Churn (Week 2) | < 5% |

---

## Files Checklist

**Backend:**
- `../pet-care-claude/backend/src/routes/vet.ts` (dashboard, bookings endpoints)
- `../pet-care-claude/backend/src/services/email.ts` (SendGrid wrapper)
- `../pet-care-claude/backend/src/services/analytics.ts` (event logger)

**Vet Dashboard:**
- `vet-dashboard/` (Next.js app, Vercel deployment)
- `vet-dashboard/app/{login,bookings,earnings,support,settings}/page.tsx`
- `vet-dashboard/lib/firebase.ts`

**Mobile:**
- `src/services/analytics.ts` (event tracking)
- `src/services/notifications.ts` (FCM setup)

**Infra:**
- `docs/ANALYTICS_SETUP.md`
- `docs/EMAIL_SETUP.md`
- `docs/VET_DASHBOARD_DEPLOYMENT.md`

---

## Implementation Order

1. Backend email + analytics services (day 1)
2. Vet dashboard scaffold + auth (day 1)
3. Mobile event tracking (day 2)
4. BigQuery pipeline (day 2)
5. Vet dashboard pages (day 3)
6. FCM notifications (day 3)
7. Data Studio dashboard (day 3)
8. Smoke tests + go live (day 4)

**Total: 3-4 days solo builder**
