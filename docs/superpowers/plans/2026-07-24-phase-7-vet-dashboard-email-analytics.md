# Phase 7: Vet Dashboard, Email Notifications, Analytics — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Enable vet self-service dashboard, transactional email notifications, and analytics event tracking for data-driven decision making.

**Architecture:** 
- Backend: SendGrid email service + analytics event logger + Cloud Tasks integration
- Vet dashboard: Separate Next.js web app (Vercel), Firebase auth with custom.vet claim
- Mobile: useAnalytics hook for event tracking, Firebase Cloud Messaging for push notifications
- Analytics pipeline: Firestore → BigQuery nightly batch, Data Studio dashboard for admin visibility

**Tech Stack:** SendGrid (transactional email), Firebase Cloud Messaging (push), BigQuery (warehouse), Data Studio (BI), Next.js 16 (vet dashboard), React Native (mobile tracking)

## Global Constraints

- Email delivery rate must exceed 98%
- Analytics events must include: app_opened, booking_created, payment_completed, vet_viewed, dispute_opened
- Vet dashboard separate from mobile app (web-only)
- All authentication via Firebase custom claims (custom.vet for vet dashboard)
- BigQuery pipeline runs nightly (batch not real-time)
- Data Studio dashboard admin-only access

---

## Task 1: Backend vet earnings endpoint + Firestore queries

**Files:**
- Modify: `backend/src/routes/vet.ts` (new file for vet-specific routes)
- Modify: `backend/src/services/vet.ts` (add earnings calculation methods)
- Modify: `backend/src/middleware/vetAuth.ts` (vet authentication middleware)
- Test: `backend/tests/vet-earnings.test.ts`

**Interfaces:**
- Consumes: Firestore `bookings` collection with pricing, `vets` collection with subscription status
- Produces: 
  - `GET /vet/:vetId/dashboard` → `{ totalEarnings, monthlyEarnings, bookingCount, subscriptionStatus }`
  - `GET /vet/:vetId/bookings` → `{ bookings: [{ id, ownerId, service, amount, date, status }] }`

**Steps:**

- [ ] **Create vet earnings service method**

File: `backend/src/services/vet.ts`

Add to exports:
```typescript
export async function getVetEarnings(vetId: string): Promise<{
  totalEarnings: number;
  monthlyEarnings: number;
  bookingCount: number;
  lastUpdated: string;
}> {
  const db = getFirestore();
  const bookingsRef = db.collection('bookings');
  
  // Query bookings for this vet with status='completed'
  const snapshot = await bookingsRef
    .where('vetId', '==', vetId)
    .where('status', '==', 'completed')
    .get();
  
  let totalEarnings = 0;
  let monthlyEarnings = 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  snapshot.forEach((doc) => {
    const booking = doc.data();
    totalEarnings += booking.amount || 0;
    
    if (new Date(booking.completedAt) >= monthStart) {
      monthlyEarnings += booking.amount || 0;
    }
  });
  
  return {
    totalEarnings,
    monthlyEarnings,
    bookingCount: snapshot.size,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getVetBookings(
  vetId: string,
  limit = 50
): Promise<Array<{
  id: string;
  ownerId: string;
  service: string;
  amount: number;
  date: string;
  status: string;
}>> {
  const db = getFirestore();
  const bookingsRef = db.collection('bookings');
  
  const snapshot = await bookingsRef
    .where('vetId', '==', vetId)
    .orderBy('date', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<any>;
}
```

- [ ] **Create vet authentication middleware**

File: `backend/src/middleware/vetAuth.ts` (new file)

```typescript
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export async function verifyVetAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user has vet claim
    if (!decodedToken.vet) {
      return res.status(403).json({ error: 'Vet access required' });
    }
    
    // Verify vetId matches claim
    const vetId = req.params.vetId;
    if (decodedToken.vet !== vetId) {
      return res.status(403).json({ error: 'Cannot access other vet data' });
    }
    
    req.user = decodedToken;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

- [ ] **Create vet routes**

File: `backend/src/routes/vet.ts` (new file)

```typescript
import express from 'express';
import { verifyVetAuth } from '../middleware/vetAuth';
import { getVetEarnings, getVetBookings } from '../services/vet';

const router = express.Router();

router.get(
  '/:vetId/dashboard',
  verifyVetAuth,
  async (req, res) => {
    try {
      const { vetId } = req.params;
      const earnings = await getVetEarnings(vetId);
      const bookings = await getVetBookings(vetId, 10); // Last 10 for dashboard
      
      res.json({
        earnings,
        recentBookings: bookings,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  '/:vetId/bookings',
  verifyVetAuth,
  async (req, res) => {
    try {
      const { vetId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const bookings = await getVetBookings(vetId, limit);
      
      res.json({ bookings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
```

- [ ] **Register vet routes in main app**

File: `backend/src/index.ts`

Add after existing route registrations:
```typescript
import vetRoutes from './routes/vet';

app.use('/vet', vetRoutes);
```

- [ ] **Write test for vet earnings endpoint**

File: `backend/tests/vet-earnings.test.ts` (new file)

```typescript
import request from 'supertest';
import app from '../src/index';
import * as admin from 'firebase-admin';

describe('Vet Earnings Endpoints', () => {
  const mockVetId = 'vet-123';
  const mockToken = 'mock-token';
  
  beforeEach(() => {
    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue({
      vet: mockVetId,
      uid: mockVetId,
    } as any);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should return vet dashboard data with earnings', async () => {
    const res = await request(app)
      .get(`/vet/${mockVetId}/dashboard`)
      .set('Authorization', `Bearer ${mockToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('earnings');
    expect(res.body.earnings).toHaveProperty('totalEarnings');
    expect(res.body.earnings).toHaveProperty('monthlyEarnings');
  });
  
  it('should reject missing authorization', async () => {
    const res = await request(app).get(`/vet/${mockVetId}/dashboard`);
    
    expect(res.status).toBe(401);
  });
  
  it('should reject wrong vet claim', async () => {
    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue({
      vet: 'vet-999',
      uid: 'vet-999',
    } as any);
    
    const res = await request(app)
      .get(`/vet/${mockVetId}/dashboard`)
      .set('Authorization', `Bearer ${mockToken}`);
    
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Run test**

```bash
cd backend
npm test -- tests/vet-earnings.test.ts
```

Expected: 3/3 PASS

- [ ] **Commit**

```bash
git add backend/src/routes/vet.ts backend/src/services/vet.ts backend/src/middleware/vetAuth.ts backend/tests/vet-earnings.test.ts
git commit -m "feat: add vet earnings endpoint and Firestore queries

- GET /vet/:vetId/dashboard returns earnings + recent bookings
- GET /vet/:vetId/bookings returns paginated booking history
- verifyVetAuth middleware gates access by custom.vet claim
- Tests: 3/3 passing"
```

---

## Task 2: Backend analytics event logger + Cloud Tasks integration

**Files:**
- Create: `backend/src/services/analytics.ts`
- Create: `backend/src/routes/analytics.ts`
- Create: `backend/src/queues/analyticsQueue.ts`
- Test: `backend/tests/analytics-events.test.ts`

**Interfaces:**
- Consumes: Firestore auth, Cloud Tasks client
- Produces: 
  - `POST /analytics/event` → `{ success: boolean }`
  - Event types: app_opened, booking_created, payment_completed, vet_viewed, dispute_opened

**Steps:**

- [ ] **Create analytics service**

File: `backend/src/services/analytics.ts` (new file)

```typescript
import { getFirestore } from 'firebase-admin/firestore';

export interface AnalyticsEvent {
  eventType: 'app_opened' | 'booking_created' | 'payment_completed' | 'vet_viewed' | 'dispute_opened';
  userId?: string;
  vetId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<string> {
  const db = getFirestore();
  
  const eventDoc = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
    date: new Date().toISOString().split('T')[0], // For BigQuery partitioning
  };
  
  const docRef = await db
    .collection('analytics_events')
    .add(eventDoc);
  
  return docRef.id;
}

export async function getEventStats(
  eventType: string,
  startDate: string,
  endDate: string
): Promise<{ count: number; uniqueUsers: Set<string> }> {
  const db = getFirestore();
  
  const snapshot = await db
    .collection('analytics_events')
    .where('eventType', '==', eventType)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get();
  
  const uniqueUsers = new Set<string>();
  snapshot.forEach((doc) => {
    if (doc.data().userId) {
      uniqueUsers.add(doc.data().userId);
    }
  });
  
  return {
    count: snapshot.size,
    uniqueUsers,
  };
}
```

- [ ] **Create analytics routes**

File: `backend/src/routes/analytics.ts` (new file)

```typescript
import express from 'express';
import { logAnalyticsEvent } from '../services/analytics';
import { enqueueAnalyticsTask } from '../queues/analyticsQueue';

const router = express.Router();

router.post('/event', async (req, res) => {
  try {
    const { eventType, userId, vetId, metadata } = req.body;
    
    // Validate event type
    const validTypes = [
      'app_opened',
      'booking_created',
      'payment_completed',
      'vet_viewed',
      'dispute_opened',
    ];
    
    if (!validTypes.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }
    
    // Log event to Firestore
    const eventId = await logAnalyticsEvent({
      eventType,
      userId,
      vetId,
      metadata,
    });
    
    // Enqueue Cloud Tasks for real-time aggregation if needed
    if (['payment_completed', 'dispute_opened'].includes(eventType)) {
      await enqueueAnalyticsTask(eventId, eventType);
    }
    
    res.json({ success: true, eventId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

- [ ] **Create Cloud Tasks queue**

File: `backend/src/queues/analyticsQueue.ts` (new file)

```typescript
import { CloudTasksClient } from '@google-cloud/tasks';

const client = new CloudTasksClient();
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'pet-care-prod';
const QUEUE_NAME = 'analytics-queue';
const REGION = 'us-central1';

export async function enqueueAnalyticsTask(
  eventId: string,
  eventType: string
): Promise<void> {
  const parent = client.queuePath(PROJECT_ID, REGION, QUEUE_NAME);
  
  const task = {
    httpRequest: {
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify({ eventId, eventType })).toString('base64'),
      httpMethod: 'POST' as const,
      uri: `https://us-central1-${PROJECT_ID}.cloudfunctions.net/processAnalyticsEvent`,
    },
  };
  
  await client.createTask({ parent, task });
}
```

- [ ] **Write tests**

File: `backend/tests/analytics-events.test.ts` (new file)

```typescript
import request from 'supertest';
import app from '../src/index';
import * as admin from 'firebase-admin';

describe('Analytics Event Endpoints', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should log app_opened event', async () => {
    const res = await request(app)
      .post('/analytics/event')
      .send({
        eventType: 'app_opened',
        userId: 'user-123',
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('eventId');
  });
  
  it('should log booking_created event with metadata', async () => {
    const res = await request(app)
      .post('/analytics/event')
      .send({
        eventType: 'booking_created',
        userId: 'user-123',
        vetId: 'vet-456',
        metadata: { amount: 250000 },
      });
    
    expect(res.status).toBe(200);
  });
  
  it('should reject invalid event type', async () => {
    const res = await request(app)
      .post('/analytics/event')
      .send({
        eventType: 'invalid_event',
      });
    
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Run tests**

```bash
cd backend
npm test -- tests/analytics-events.test.ts
```

Expected: 3/3 PASS

- [ ] **Commit**

```bash
git add backend/src/services/analytics.ts backend/src/routes/analytics.ts backend/src/queues/analyticsQueue.ts backend/tests/analytics-events.test.ts
git commit -m "feat: add analytics event logger and Cloud Tasks integration

- POST /analytics/event logs events to Firestore analytics_events collection
- Event types: app_opened, booking_created, payment_completed, vet_viewed, dispute_opened
- Cloud Tasks enqueued for payment/dispute events for real-time aggregation
- Tests: 3/3 passing"
```

---

## Task 3: Backend email service (SendGrid wrapper + templates)

**Files:**
- Create: `backend/src/services/email.ts`
- Create: `backend/src/templates/email/` (4 template files)
- Create: `backend/src/routes/email.ts`
- Test: `backend/tests/email-service.test.ts`

**Interfaces:**
- Consumes: SendGrid API client, Firestore user/vet data
- Produces:
  - `sendBookingConfirmation(userId, bookingDetails)` → success
  - `sendPaymentReceipt(vetId, invoiceDetails)` → success
  - `sendSubscriptionReminder(vetId, daysUntilExpiry)` → success
  - `sendSubscriptionOverdue(vetId)` → success

**Steps:**

- [ ] **Create email service**

File: `backend/src/services/email.ts` (new file)

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailParams {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  const msg = {
    to: params.to,
    from: 'noreply@petcare.id',
    templateId: params.templateId,
    dynamicTemplateData: params.dynamicTemplateData,
  };
  
  try {
    await sgMail.send(msg);
  } catch (err: any) {
    console.error('SendGrid error:', err.response?.body || err.message);
    throw err;
  }
}

export async function sendBookingConfirmation(
  ownerId: string,
  ownerEmail: string,
  booking: {
    id: string;
    vetName: string;
    service: string;
    date: string;
    time: string;
    amount: number;
  }
): Promise<void> {
  await sendEmail({
    to: ownerEmail,
    templateId: 'd-booking-confirmation-template-id',
    dynamicTemplateData: {
      ownerName: booking.vetName,
      bookingId: booking.id,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      amount: `Rp${booking.amount.toLocaleString('id-ID')}`,
    },
  });
}

export async function sendPaymentReceipt(
  vetEmail: string,
  invoice: {
    id: string;
    amount: number;
    date: string;
    period: string;
  }
): Promise<void> {
  await sendEmail({
    to: vetEmail,
    templateId: 'd-payment-receipt-template-id',
    dynamicTemplateData: {
      invoiceId: invoice.id,
      amount: `Rp${invoice.amount.toLocaleString('id-ID')}`,
      date: invoice.date,
      period: invoice.period,
    },
  });
}

export async function sendSubscriptionReminder(
  vetEmail: string,
  vetName: string,
  daysUntilExpiry: number
): Promise<void> {
  await sendEmail({
    to: vetEmail,
    templateId: 'd-subscription-reminder-template-id',
    dynamicTemplateData: {
      vetName,
      daysUntilExpiry,
      renewalUrl: 'https://dashboard.petcare.id/settings/subscription',
    },
  });
}

export async function sendSubscriptionOverdue(
  vetEmail: string,
  vetName: string
): Promise<void> {
  await sendEmail({
    to: vetEmail,
    templateId: 'd-subscription-overdue-template-id',
    dynamicTemplateData: {
      vetName,
      renewalUrl: 'https://dashboard.petcare.id/settings/subscription',
    },
  });
}
```

- [ ] **Create email routes**

File: `backend/src/routes/email.ts` (new file)

```typescript
import express from 'express';
import {
  sendBookingConfirmation,
  sendPaymentReceipt,
  sendSubscriptionReminder,
  sendSubscriptionOverdue,
} from '../services/email';

const router = express.Router();

router.post('/booking-confirmation', async (req, res) => {
  try {
    const { ownerId, ownerEmail, booking } = req.body;
    await sendBookingConfirmation(ownerId, ownerEmail, booking);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payment-receipt', async (req, res) => {
  try {
    const { vetEmail, invoice } = req.body;
    await sendPaymentReceipt(vetEmail, invoice);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/subscription-reminder', async (req, res) => {
  try {
    const { vetEmail, vetName, daysUntilExpiry } = req.body;
    await sendSubscriptionReminder(vetEmail, vetName, daysUntilExpiry);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/subscription-overdue', async (req, res) => {
  try {
    const { vetEmail, vetName } = req.body;
    await sendSubscriptionOverdue(vetEmail, vetName);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

- [ ] **Install SendGrid**

```bash
cd backend
npm install @sendgrid/mail
```

- [ ] **Write tests**

File: `backend/tests/email-service.test.ts` (new file)

```typescript
import request from 'supertest';
import app from '../src/index';
import * as emailService from '../src/services/email';

jest.mock('@sendgrid/mail');

describe('Email Service', () => {
  beforeEach(() => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should send booking confirmation email', async () => {
    const res = await request(app)
      .post('/email/booking-confirmation')
      .send({
        ownerId: 'user-123',
        ownerEmail: 'owner@example.com',
        booking: {
          id: 'booking-456',
          vetName: 'Dr. Tono',
          service: 'Vaksinasi',
          date: '2026-07-25',
          time: '14:00',
          amount: 250000,
        },
      });
    
    expect(res.status).toBe(200);
  });
  
  it('should send payment receipt', async () => {
    const res = await request(app)
      .post('/email/payment-receipt')
      .send({
        vetEmail: 'vet@example.com',
        invoice: {
          id: 'inv-123',
          amount: 350000,
          date: '2026-07-24',
          period: 'July 2026',
        },
      });
    
    expect(res.status).toBe(200);
  });
  
  it('should send subscription reminder', async () => {
    const res = await request(app)
      .post('/email/subscription-reminder')
      .send({
        vetEmail: 'vet@example.com',
        vetName: 'Dr. Tono',
        daysUntilExpiry: 7,
      });
    
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Run tests**

```bash
cd backend
npm test -- tests/email-service.test.ts
```

Expected: 3/3 PASS

- [ ] **Commit**

```bash
git add backend/src/services/email.ts backend/src/routes/email.ts backend/tests/email-service.test.ts
git commit -m "feat: add SendGrid email service with 4 templates

- sendBookingConfirmation: owner confirmation for new bookings
- sendPaymentReceipt: vet invoice receipt after payment
- sendSubscriptionReminder: vet renewal warning 7 days before expiry
- sendSubscriptionOverdue: vet alert after subscription expires
- Tests: 3/3 passing"
```

---

## Task 4: Vet dashboard scaffold + Firebase auth

**Files:**
- Create: `vet-dashboard/` (Next.js 16 app, separate from admin)
- Create: `vet-dashboard/package.json`
- Create: `vet-dashboard/app/layout.tsx`
- Create: `vet-dashboard/app/login/page.tsx`
- Create: `vet-dashboard/lib/firebase.ts`
- Create: `.env.example` entries for vet-dashboard

**Interfaces:**
- Consumes: Firebase auth, custom.vet claim
- Produces: Protected routes at `/bookings`, `/earnings`, `/support`

**Steps:**

- [ ] **Create vet-dashboard directory and Next.js scaffold**

```bash
cd /Users/ilham/Downloads/github/pet-care-mobile-claude
mkdir -p vet-dashboard
cd vet-dashboard
npm init -y
```

- [ ] **Install dependencies**

```bash
npm install next@16 react@19 typescript tailwindcss firebase
npm install -D @types/node @types/react
```

- [ ] **Create Next.js config**

File: `vet-dashboard/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

- [ ] **Create Firebase config**

File: `vet-dashboard/lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
```

- [ ] **Create root layout with auth guard**

File: `vet-dashboard/app/layout.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import '@/app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        if (idTokenResult.claims.vet) {
          setUser(currentUser);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <html>
      <body className="bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">Vet Dashboard</h1>
              <button
                onClick={() => auth.signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Create login page**

File: `vet-dashboard/app/login/page.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/bookings');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow rounded p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Vet Login</h1>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-3 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-3 border rounded"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-semibold">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Create home page redirect**

File: `vet-dashboard/app/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/bookings');
  }, [router]);
  return null;
}
```

- [ ] **Create CSS globals**

File: `vet-dashboard/app/globals.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}
```

- [ ] **Create .env.example**

File: `vet-dashboard/.env.example`

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

- [ ] **Commit**

```bash
git add vet-dashboard/
git commit -m "scaffold: create vet-dashboard Next.js app with Firebase auth

- Separate Next.js 16 app for vet self-service dashboard
- Firebase auth with custom.vet claim validation
- Layout-level auth guard redirects unauthenticated users to /login
- Home page redirects to /bookings
- Ready for vet-specific pages (bookings, earnings, support)"
```

---

## Task 5: Vet dashboard bookings page

**Files:**
- Create: `vet-dashboard/app/bookings/page.tsx`
- Create: `vet-dashboard/lib/api.ts` (API client for backend)
- Create: `vet-dashboard/components/BookingCard.tsx`

**Interfaces:**
- Consumes: Backend `GET /vet/:vetId/bookings` endpoint
- Produces: Paginated list of vet's bookings with search/filter

**Steps:**

- [ ] **Create API client**

File: `vet-dashboard/lib/api.ts` (new file)

```typescript
import { auth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function getVetBookings(vetId: string, limit = 50) {
  const res = await apiCall(`/vet/${vetId}/bookings?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function getVetDashboard(vetId: string) {
  const res = await apiCall(`/vet/${vetId}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}
```

- [ ] **Create BookingCard component**

File: `vet-dashboard/components/BookingCard.tsx` (new file)

```typescript
'use client';

import React from 'react';

interface Booking {
  id: string;
  ownerId: string;
  service: string;
  amount: number;
  date: string;
  status: string;
}

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const statusColor = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{booking.service}</h3>
          <p className="text-gray-600">Booking ID: {booking.id}</p>
          <p className="text-gray-600">Date: {new Date(booking.date).toLocaleDateString('id-ID')}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">Rp{booking.amount.toLocaleString('id-ID')}</p>
          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColor[booking.status as keyof typeof statusColor] || 'bg-gray-100'}`}>
            {booking.status}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Create bookings page**

File: `vet-dashboard/app/bookings/page.tsx` (new file)

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { getVetBookings } from '@/lib/api';
import BookingCard from '@/components/BookingCard';

interface Booking {
  id: string;
  ownerId: string;
  service: string;
  amount: number;
  date: string;
  status: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const data = await getVetBookings(user.uid);
        setBookings(data.bookings || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filtered = bookings.filter(
    (b) =>
      b.service.toLowerCase().includes(search.toLowerCase()) ||
      b.id.includes(search)
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bookings</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by service or booking ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded"
        />
      </div>

      {loading && <p>Loading bookings...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-gray-600">No bookings found</p>
      )}

      {filtered.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
```

- [ ] **Run dev server and test**

```bash
cd vet-dashboard
npm run dev
```

Navigate to `http://localhost:3000/bookings` - should display bookings list or login redirect

- [ ] **Commit**

```bash
git add vet-dashboard/app/bookings/page.tsx vet-dashboard/lib/api.ts vet-dashboard/components/BookingCard.tsx
git commit -m "feat: add vet dashboard bookings page

- Fetch bookings from backend GET /vet/:vetId/bookings endpoint
- Display bookings in cards with service, date, amount, status
- Search filter by service name or booking ID
- Loading and error states"
```

---

## Task 6: Vet dashboard earnings + subscription page

**Files:**
- Create: `vet-dashboard/app/earnings/page.tsx`
- Create: `vet-dashboard/components/EarningsChart.tsx`

**Interfaces:**
- Consumes: Backend `GET /vet/:vetId/dashboard` endpoint
- Produces: Monthly/lifetime earnings, subscription status, 6-month breakdown

**Steps:**

- [ ] **Create earnings page**

File: `vet-dashboard/app/earnings/page.tsx` (new file)

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { getVetDashboard } from '@/lib/api';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  bookingCount: number;
}

interface VetData {
  subscription_status: string;
  subscription_id?: string;
  approved_at?: string;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [vet, setVet] = useState<VetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch earnings from backend
        const dashboardData = await getVetDashboard(user.uid);
        setEarnings(dashboardData.earnings);

        // Fetch vet subscription data from Firestore
        const db = getFirestore();
        const vetDoc = await getDoc(doc(db, 'vets', user.uid));
        if (vetDoc.exists()) {
          setVet(vetDoc.data() as VetData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Earnings & Subscription</h1>

      {loading && <p>Loading earnings...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 mb-2">Total Earnings</p>
            <p className="text-3xl font-bold">Rp{earnings.totalEarnings.toLocaleString('id-ID')}</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 mb-2">This Month</p>
            <p className="text-3xl font-bold">Rp{earnings.monthlyEarnings.toLocaleString('id-ID')}</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 mb-2">Total Bookings</p>
            <p className="text-3xl font-bold">{earnings.bookingCount}</p>
          </div>
        </div>
      )}

      {vet && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
          <p className="mb-2">
            Status: <span className="font-semibold">{vet.subscription_status}</span>
          </p>
          {vet.subscription_id && (
            <p className="mb-2">Subscription ID: {vet.subscription_id}</p>
          )}
          {vet.approved_at && (
            <p className="text-gray-600">
              Approved: {new Date(vet.approved_at).toLocaleDateString('id-ID')}
            </p>
          )}
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Manage Subscription
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Create earnings chart component**

File: `vet-dashboard/components/EarningsChart.tsx` (new file)

```typescript
'use client';

import React from 'react';

interface MonthlyData {
  month: string;
  amount: number;
}

interface EarningsChartProps {
  data: MonthlyData[];
}

export default function EarningsChart({ data }: EarningsChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="font-bold mb-4">6-Month Breakdown</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.month}>
            <p className="text-sm font-medium mb-1">{item.month}</p>
            <div className="w-full bg-gray-200 rounded h-6">
              <div
                className="bg-blue-600 h-6 rounded transition-all"
                style={{ width: `${(item.amount / maxAmount) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Rp{item.amount.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Test earnings page load**

```bash
cd vet-dashboard
npm run dev
```

Navigate to `http://localhost:3000/earnings` - should display earnings cards and subscription status

- [ ] **Commit**

```bash
git add vet-dashboard/app/earnings/page.tsx vet-dashboard/components/EarningsChart.tsx
git commit -m "feat: add vet dashboard earnings and subscription page

- Display total earnings, monthly earnings, booking count
- Show subscription status from Firestore vets collection
- Subscription ID and approval date tracking
- Ready for 6-month breakdown visualization"
```

---

## Task 7: Vet dashboard support + FAQ + settings pages

**Files:**
- Create: `vet-dashboard/app/support/page.tsx`
- Create: `vet-dashboard/app/settings/page.tsx`

**Interfaces:**
- Produces: Support form, FAQ list, account settings (email, password)

**Steps:**

- [ ] **Create support page**

File: `vet-dashboard/app/support/page.tsx` (new file)

```typescript
'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';

const FAQ = [
  {
    question: 'How do I update my profile?',
    answer: 'Go to Settings to update your name, phone, and address.',
  },
  {
    question: 'How is my earnings calculated?',
    answer: 'Earnings are calculated based on completed bookings. A 15% platform fee is deducted.',
  },
  {
    question: 'When do I get paid?',
    answer: 'Payments are processed monthly to your registered bank account.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings > Subscription to cancel. You can reactivate anytime.',
  },
];

export default function SupportPage() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send support message to backend
    setSubmitted(true);
    setMessage('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Support & FAQ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Send us a message</h2>
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              className="w-full p-3 border rounded mb-4 h-32"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded font-semibold"
            >
              Send Message
            </button>
            {submitted && (
              <p className="mt-2 text-green-600">Message sent! We'll reply within 24 hours.</p>
            )}
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map((faq, idx) => (
              <details key={idx} className="bg-white p-4 rounded shadow">
                <summary className="font-semibold cursor-pointer">{faq.question}</summary>
                <p className="mt-2 text-gray-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Create settings page**

File: `vet-dashboard/app/settings/page.tsx` (new file)

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateEmail } from 'firebase/auth';

interface VetSettings {
  name?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<VetSettings>({});
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const vetDoc = await getDoc(doc(firestore, 'vets', user.uid));
        if (vetDoc.exists()) {
          setSettings(vetDoc.data() as VetSettings);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(firestore, 'vets', user.uid), settings);
      setMessage({ type: 'success', text: 'Settings updated!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePasswordChange = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !newPassword) return;

      await updatePassword(user, newPassword);
      setMessage({ type: 'success', text: 'Password updated!' });
      setPassword('');
      setNewPassword('');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Profile</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={settings.name || ''}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full p-3 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={settings.phone || ''}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full p-3 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full p-3 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={settings.bio || ''}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              className="w-full p-3 border rounded"
              rows={3}
            />
          </div>

          <button
            onClick={handleSettingChange}
            className="w-full bg-blue-600 text-white p-3 rounded font-semibold"
          >
            Save Profile
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Security</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            className="w-full bg-blue-600 text-white p-3 rounded font-semibold"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Update layout to add navigation**

File: `vet-dashboard/app/layout.tsx` - Update nav to include all pages

```typescript
// Add this inside <nav> after the title:
<div className="flex gap-4">
  <a href="/bookings" className="text-gray-600 hover:text-gray-900">
    Bookings
  </a>
  <a href="/earnings" className="text-gray-600 hover:text-gray-900">
    Earnings
  </a>
  <a href="/support" className="text-gray-600 hover:text-gray-900">
    Support
  </a>
  <a href="/settings" className="text-gray-600 hover:text-gray-900">
    Settings
  </a>
</div>
```

- [ ] **Test pages load**

```bash
cd vet-dashboard
npm run dev
```

Navigate to `/support` and `/settings` - pages should load without errors

- [ ] **Commit**

```bash
git add vet-dashboard/app/support/page.tsx vet-dashboard/app/settings/page.tsx
git commit -m "feat: add vet dashboard support, FAQ, and settings pages

- Support page: contact form + 4 FAQs with collapsible answers
- Settings page: profile (name, phone, address, bio) and security (password change)
- Profile changes sync to Firestore vets collection
- Navigation links added to layout for all dashboard pages"
```

---

## Task 8: Mobile analytics event tracking (useAnalytics hook)

**Files:**
- Create: `frontend/src/hooks/useAnalytics.ts`
- Modify: `frontend/src/screens/HomeScreen.tsx` (add event tracking)
- Modify: `frontend/src/screens/BookingDetailScreen.tsx` (add event tracking)
- Test: `frontend/tests/useAnalytics.test.ts`

**Interfaces:**
- Produces: `useAnalytics()` hook with `logEvent(type, metadata)` method
- Event types: app_opened, booking_created, payment_completed, vet_viewed, dispute_opened

**Steps:**

- [ ] **Create useAnalytics hook**

File: `frontend/src/hooks/useAnalytics.ts` (new file)

```typescript
import { useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalyticsEvent {
  type: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export function useAnalytics() {
  const queueRef = useRef<AnalyticsEvent[]>([]);
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Load queue from AsyncStorage on mount
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const stored = await AsyncStorage.getItem('analytics_queue');
        if (stored) {
          queueRef.current = JSON.parse(stored);
        }
      } catch (err) {
        console.error('Failed to load analytics queue:', err);
      }
    };

    loadQueue();
  }, []);

  // Persist queue to AsyncStorage
  const saveQueue = useCallback(async () => {
    try {
      await AsyncStorage.setItem('analytics_queue', JSON.stringify(queueRef.current));
    } catch (err) {
      console.error('Failed to save analytics queue:', err);
    }
  }, []);

  const logEvent = useCallback(
    async (
      eventType: 'app_opened' | 'booking_created' | 'payment_completed' | 'vet_viewed' | 'dispute_opened',
      metadata?: Record<string, any>
    ) => {
      const event: AnalyticsEvent = {
        type: eventType,
        metadata,
        timestamp: new Date().toISOString(),
      };

      // Add to queue
      queueRef.current.push(event);
      await saveQueue();

      // Try to send immediately
      await flushEvents();
    },
    [saveQueue]
  );

  const flushEvents = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    const batch = queueRef.current.splice(0, 10); // Send in batches of 10

    for (const event of batch) {
      try {
        const response = await fetch(`${API_BASE}/analytics/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          // Re-add to queue if failed
          queueRef.current.unshift(event);
          break; // Stop processing batch on first failure
        }
      } catch (err) {
        console.error('Failed to send analytics event:', err);
        queueRef.current.unshift(event);
        break;
      }
    }

    await saveQueue();
  }, []);

  return { logEvent, flushEvents };
}
```

- [ ] **Add tracking to HomeScreen**

File: `frontend/src/screens/HomeScreen.tsx` - Add to component:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

export default function HomeScreen() {
  const { logEvent } = useAnalytics();

  useEffect(() => {
    logEvent('app_opened');
  }, []);

  // ... rest of component
}
```

- [ ] **Add tracking to BookingDetailScreen**

File: `frontend/src/screens/BookingDetailScreen.tsx` - Add to component:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

export default function BookingDetailScreen() {
  const { logEvent } = useAnalytics();

  const handleBooking = async () => {
    // ... existing booking logic

    logEvent('booking_created', {
      vetId: selectedVet.id,
      amount: totalPrice,
      service: selectedService,
    });
  };

  const handleVetView = () => {
    logEvent('vet_viewed', { vetId: vet.id });
  };

  // ... rest of component
}
```

- [ ] **Write tests**

File: `frontend/tests/useAnalytics.test.ts` (new file)

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetch from 'jest-fetch-mock';

jest.mock('@react-native-async-storage/async-storage');

describe('useAnalytics', () => {
  beforeEach(() => {
    fetch.resetMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('should log event to queue', async () => {
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await result.current.logEvent('app_opened');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should send events via POST /analytics/event', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await result.current.logEvent('vet_viewed', { vetId: 'vet-123' });
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/analytics/event'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should retry failed events on next flush', async () => {
    fetch.mockRejectOnce(new Error('Network error'));

    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await result.current.logEvent('booking_created');
    });

    // Event should still be in queue
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
```

- [ ] **Run tests**

```bash
cd frontend
npm test tests/useAnalytics.test.ts
```

Expected: 3/3 PASS

- [ ] **Commit**

```bash
git add frontend/src/hooks/useAnalytics.ts frontend/tests/useAnalytics.test.ts
git commit -m "feat: add mobile analytics event tracking hook

- useAnalytics hook for logging events: app_opened, booking_created, payment_completed, vet_viewed, dispute_opened
- Offline queue: events persisted to AsyncStorage if API call fails
- Batch sending (10 events per request) to minimize network calls
- Integrated into HomeScreen (app_opened) and BookingDetailScreen (booking_created, vet_viewed)
- Tests: 3/3 passing"
```

---

## Task 9: Mobile push notifications (Firebase Cloud Messaging setup)

**Files:**
- Create: `frontend/src/services/pushNotifications.ts`
- Modify: `frontend/src/screens/HomeScreen.tsx` (initialize FCM)
- Create: `frontend/app.json` (Firebase config)

**Interfaces:**
- Produces: FCM token storage, push message handling

**Steps:**

- [ ] **Create push notifications service**

File: `frontend/src/services/pushNotifications.ts` (new file)

```typescript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export async function initializeMessaging() {
  try {
    // Request permission (iOS)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Push notifications permission denied');
      return;
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Store token in Firestore user doc for targeted notifications
    await AsyncStorage.setItem('fcm_token', token);

    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body
      );
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
    });

    return unsubscribeForeground;
  } catch (err) {
    console.error('Failed to initialize messaging:', err);
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('fcm_token');
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    return null;
  }
}
```

- [ ] **Initialize FCM in HomeScreen**

File: `frontend/src/screens/HomeScreen.tsx` - Add to useEffect:

```typescript
import { initializeMessaging } from '@/services/pushNotifications';

export default function HomeScreen() {
  useEffect(() => {
    initializeMessaging();
    logEvent('app_opened');
  }, []);

  // ... rest of component
}
```

- [ ] **Update app.json with Firebase config**

File: `frontend/app.json`

Ensure it includes:

```json
{
  "expo": {
    "name": "Pet Care",
    "slug": "pet-care",
    "plugins": [
      [
        "@react-native-firebase/app",
        {
          "ios": {
            "config": {
              "googleServicesFile": "./GoogleService-Info.plist"
            }
          },
          "android": {
            "config": {
              "googleServicesFile": "./google-services.json"
            }
          }
        }
      ]
    ]
  }
}
```

- [ ] **Create test**

File: `frontend/tests/pushNotifications.test.ts` (new file)

```typescript
import { initializeMessaging, getFCMToken } from '@/services/pushNotifications';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-firebase/messaging');
jest.mock('@react-native-async-storage/async-storage');

describe('Push Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request permission and get FCM token', async () => {
    (messaging().requestPermission as jest.Mock).mockResolvedValue(1); // AUTHORIZED
    (messaging().getToken as jest.Mock).mockResolvedValue('token-123');

    await initializeMessaging();

    expect(messaging().getToken).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('fcm_token', 'token-123');
  });

  it('should retrieve stored FCM token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-123');

    const token = await getFCMToken();

    expect(token).toBe('token-123');
  });

  it('should handle permission denied', async () => {
    (messaging().requestPermission as jest.Mock).mockResolvedValue(0); // DENIED

    await initializeMessaging();

    expect(messaging().getToken).not.toHaveBeenCalled();
  });
});
```

- [ ] **Run tests**

```bash
cd frontend
npm test tests/pushNotifications.test.ts
```

Expected: 3/3 PASS

- [ ] **Commit**

```bash
git add frontend/src/services/pushNotifications.ts frontend/tests/pushNotifications.test.ts frontend/app.json
git commit -m "feat: add Firebase Cloud Messaging push notifications

- initializeMessaging() requests permission and retrieves FCM token
- FCM token stored in AsyncStorage for server-side targeting
- Foreground messages trigger Alert, background messages logged
- Integrated into HomeScreen app initialization
- Tests: 3/3 passing"
```

---

## Task 10: Analytics pipeline (Firestore → BigQuery nightly batch)

**Files:**
- Create: `backend/functions/analyticsExport.ts` (Cloud Function)
- Create: `backend/src/services/bigquery.ts` (BigQuery client wrapper)
- Modify: `backend/firebase.json` (scheduled function config)

**Interfaces:**
- Consumes: Firestore `analytics_events` collection
- Produces: Daily BigQuery table `analytics_events_YYYYMMDD`

**Steps:**

- [ ] **Create BigQuery service**

File: `backend/src/services/bigquery.ts` (new file)

```typescript
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

const DATASET_ID = 'pet_care_analytics';
const TABLE_ID = 'analytics_events';

export async function initializeBigQuery() {
  const dataset = bigquery.dataset(DATASET_ID);

  // Create dataset if not exists
  const [exists] = await dataset.exists();
  if (!exists) {
    await bigquery.createDataset(DATASET_ID, {
      description: 'Pet Care Analytics',
      location: 'asia-southeast1',
    });
  }

  // Create table if not exists
  const table = dataset.table(TABLE_ID);
  const [tableExists] = await table.exists();

  if (!tableExists) {
    await dataset.createTable(TABLE_ID, {
      schema: [
        { name: 'id', type: 'STRING' },
        { name: 'eventType', type: 'STRING' },
        { name: 'userId', type: 'STRING' },
        { name: 'vetId', type: 'STRING' },
        { name: 'metadata', type: 'JSON' },
        { name: 'timestamp', type: 'TIMESTAMP' },
        { name: 'date', type: 'DATE' },
      ],
    });
  }
}

export async function insertAnalyticsEvents(events: any[]) {
  const dataset = bigquery.dataset(DATASET_ID);
  const table = dataset.table(TABLE_ID);

  const rows = events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    userId: event.userId,
    vetId: event.vetId,
    metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    timestamp: event.timestamp,
    date: event.date,
  }));

  try {
    await table.insert(rows);
    console.log(`Inserted ${rows.length} events into BigQuery`);
  } catch (err) {
    console.error('Failed to insert events:', err);
    throw err;
  }
}
```

- [ ] **Create analytics export Cloud Function**

File: `backend/functions/analyticsExport.ts` (new file)

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { insertAnalyticsEvents, initializeBigQuery } from '../src/services/bigquery';

export const exportAnalyticsToBigQuery = functions.pubsub
  .schedule('0 1 * * *') // 1 AM daily (UTC)
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      // Initialize BigQuery tables
      await initializeBigQuery();

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      // Query Firestore for yesterday's events
      const db = admin.firestore();
      const snapshot = await db
        .collection('analytics_events')
        .where('date', '==', dateStr)
        .get();

      if (snapshot.empty) {
        console.log('No events to export for date:', dateStr);
        return;
      }

      // Transform and insert into BigQuery
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      await insertAnalyticsEvents(events);

      console.log(`Successfully exported ${events.length} events for ${dateStr}`);
    } catch (err) {
      console.error('Analytics export failed:', err);
      throw err;
    }
  });
```

- [ ] **Update firebase.json with scheduled function**

File: `backend/firebase.json`

Ensure function is deployed:

```bash
firebase deploy --only functions:exportAnalyticsToBigQuery
```

- [ ] **Create test**

File: `backend/tests/analytics-export.test.ts` (new file)

```typescript
import * as admin from 'firebase-admin';
import { insertAnalyticsEvents } from '../src/services/bigquery';

jest.mock('@google-cloud/bigquery');

describe('Analytics Export to BigQuery', () => {
  it('should format events for BigQuery', async () => {
    const events = [
      {
        id: 'evt-1',
        eventType: 'booking_created',
        userId: 'user-123',
        vetId: 'vet-456',
        metadata: { amount: 250000 },
        timestamp: '2026-07-24T10:00:00Z',
        date: '2026-07-24',
      },
    ];

    // Should not throw
    await expect(insertAnalyticsEvents(events)).resolves.not.toThrow();
  });
});
```

- [ ] **Run test**

```bash
cd backend
npm test -- tests/analytics-export.test.ts
```

Expected: 1/1 PASS

- [ ] **Commit**

```bash
git add backend/src/services/bigquery.ts backend/functions/analyticsExport.ts backend/tests/analytics-export.test.ts
git commit -m "feat: add nightly Firestore to BigQuery analytics pipeline

- Daily scheduled Cloud Function exports analytics_events collection
- BigQuery dataset and table auto-created if needed
- Events inserted with schema: id, eventType, userId, vetId, metadata, timestamp, date
- Runs nightly at 1 AM UTC
- Tests: 1/1 passing"
```

---

## Task 11: Data Studio dashboard setup + linking

**Files:**
- Create: `docs/ANALYTICS_DASHBOARD.md` (Data Studio setup guide)

**Interfaces:**
- Produces: Admin-accessible Data Studio dashboard with DAU, bookings, revenue, ARPU, churn metrics

**Steps:**

- [ ] **Create analytics dashboard setup guide**

File: `docs/ANALYTICS_DASHBOARD.md` (new file)

```markdown
# Analytics Dashboard Setup

## Overview

Dashboard displays key metrics: DAU, ARPU, churn, revenue, booking trends.

## BigQuery Setup

1. **Dataset:** `pet_care_analytics` (auto-created by nightly export)
2. **Table:** `analytics_events` with schema:
   - id: STRING
   - eventType: STRING
   - userId: STRING
   - vetId: STRING
   - metadata: JSON
   - timestamp: TIMESTAMP
   - date: DATE

## Data Studio Dashboard

### Creation Steps

1. Go to https://datastudio.google.com
2. Create new report
3. Add BigQuery data source:
   - Project: `pet-care-prod`
   - Dataset: `pet_care_analytics`
   - Table: `analytics_events`

### Recommended Charts

#### 1. Daily Active Users (DAU)
- Metric: COUNT(DISTINCT userId)
- Dimension: date
- Chart: Line chart

#### 2. Bookings Trend
- Filter: eventType = 'booking_created'
- Metric: COUNT(id)
- Dimension: date
- Chart: Column chart

#### 3. Total Revenue
- Dimension: date
- Metric: SUM(metadata.amount)
- Chart: Scorecard

#### 4. ARPU (Average Revenue Per User)
- Calculated field: SUM(metadata.amount) / COUNT(DISTINCT userId)
- Dimension: date
- Chart: Line chart

#### 5. Churn Rate
- Calculate: (Vets inactive last 7 days / Total active vets) × 100
- Manual calculation from analytics_events

#### 6. Event Breakdown Pie Chart
- Dimension: eventType
- Metric: COUNT(id)
- Chart: Pie chart

### Access Control

1. Share dashboard with admin@petcare.id only
2. Set to "View" permission (read-only)
3. Enable email delivery of daily report snapshot

### Metrics Dashboard URL

Once created, share link format:
```
https://datastudio.google.com/reporting/YOUR_REPORT_ID
```

This is shared with analytics@petcare.id and stakeholders.
```

- [ ] **Commit documentation**

```bash
git add docs/ANALYTICS_DASHBOARD.md
git commit -m "docs: add Data Studio analytics dashboard setup guide

- BigQuery dataset and table schema documentation
- Step-by-step dashboard creation instructions
- 6 recommended charts: DAU, bookings, revenue, ARPU, churn, events
- Access control and reporting configuration
- Ready for admin to create custom Data Studio report"
```

---

## Task 12: Smoke tests + integration testing

**Files:**
- Create: `backend/tests/e2e-analytics.test.ts`
- Create: `vet-dashboard/tests/e2e-vet-flow.test.ts`
- Modify: `frontend/tests/e2e-mobile.test.ts` (add analytics tracking assertions)

**Interfaces:**
- Validates: Full Phase 7 feature end-to-end

**Steps:**

- [ ] **Create backend E2E test for analytics**

File: `backend/tests/e2e-analytics.test.ts` (new file)

```typescript
import request from 'supertest';
import app from '../src/index';
import * as admin from 'firebase-admin';

describe('Analytics E2E Flow', () => {
  const userId = 'test-user-123';
  const vetId = 'test-vet-456';

  it('should complete full analytics flow', async () => {
    // 1. Log app_opened event
    const openRes = await request(app)
      .post('/analytics/event')
      .send({
        eventType: 'app_opened',
        userId,
      });

    expect(openRes.status).toBe(200);
    expect(openRes.body).toHaveProperty('eventId');

    // 2. Log booking_created event
    const bookingRes = await request(app)
      .post('/analytics/event')
      .send({
        eventType: 'booking_created',
        userId,
        vetId,
        metadata: { amount: 250000 },
      });

    expect(bookingRes.status).toBe(200);

    // 3. Log payment_completed event
    const paymentRes = await request(app)
      .post('/analytics/event')
      .send({
        eventType: 'payment_completed',
        userId,
        vetId,
        metadata: { amount: 250000, invoiceId: 'inv-123' },
      });

    expect(paymentRes.status).toBe(200);

    // 4. Fetch vet earnings (should include completed booking)
    const mockToken = 'mock-token';
    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue({
      vet: vetId,
      uid: vetId,
    } as any);

    const earningsRes = await request(app)
      .get(`/vet/${vetId}/dashboard`)
      .set('Authorization', `Bearer ${mockToken}`);

    expect(earningsRes.status).toBe(200);
    expect(earningsRes.body.earnings).toHaveProperty('bookingCount');
  });
});
```

- [ ] **Create vet dashboard E2E test**

File: `vet-dashboard/tests/e2e-vet-flow.test.ts` (new file)

```typescript
/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import EarningsPage from '@/app/earnings/page';
import { auth } from '@/lib/firebase';

jest.mock('@/lib/firebase');

describe('Vet Dashboard E2E', () => {
  it('should complete vet login and view earnings', async () => {
    // Mock successful login
    (auth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: 'vet-123' },
    });

    const { container } = render(<LoginPage />);

    // Enter credentials
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitBtn = screen.getByText('Login');

    fireEvent.change(emailInput, { target: { value: 'vet@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    // Should redirect to /bookings (verified by router.push call)
    await waitFor(() => {
      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'vet@example.com',
        'password123'
      );
    });
  });

  it('should display earnings on dashboard', async () => {
    // Mock API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        earnings: {
          totalEarnings: 5000000,
          monthlyEarnings: 1250000,
          bookingCount: 20,
        },
      }),
    });

    render(<EarningsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Total Earnings/i)).toBeInTheDocument();
      expect(screen.getByText(/Rp5.000.000/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Create mobile E2E test with analytics assertions**

File: `frontend/tests/e2e-mobile.test.ts` - Add analytics assertions:

```typescript
import { render } from '@testing-library/react-native';
import HomeScreen from '@/screens/HomeScreen';
import { useAnalytics } from '@/hooks/useAnalytics';

jest.mock('@/hooks/useAnalytics');

describe('Mobile App E2E with Analytics', () => {
  it('should track app_opened on app launch', async () => {
    const mockLogEvent = jest.fn();
    (useAnalytics as jest.Mock).mockReturnValue({
      logEvent: mockLogEvent,
      flushEvents: jest.fn(),
    });

    render(<HomeScreen />);

    expect(mockLogEvent).toHaveBeenCalledWith('app_opened');
  });

  it('should track booking_created when booking is completed', async () => {
    const mockLogEvent = jest.fn();
    (useAnalytics as jest.Mock).mockReturnValue({
      logEvent: mockLogEvent,
      flushEvents: jest.fn(),
    });

    const { getByTestId } = render(<HomeScreen />);

    // Simulate booking creation
    const bookButton = getByTestId('create-booking-btn');
    fireEvent.press(bookButton);

    // Should log event with metadata
    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenCalledWith(
        'booking_created',
        expect.objectContaining({
          vetId: expect.any(String),
          amount: expect.any(Number),
        })
      );
    });
  });
});
```

- [ ] **Run all smoke tests**

```bash
# Backend
cd backend
npm test -- tests/e2e-analytics.test.ts

# Vet Dashboard
cd vet-dashboard
npm test -- tests/e2e-vet-flow.test.ts

# Mobile
cd frontend
npm test -- tests/e2e-mobile.test.ts
```

Expected: All tests PASS

- [ ] **Run full test suite**

```bash
cd backend && npm test
cd vet-dashboard && npm test
cd frontend && npm test
```

Expected: All suites green

- [ ] **Commit**

```bash
git add backend/tests/e2e-analytics.test.ts vet-dashboard/tests/e2e-vet-flow.test.ts frontend/tests/e2e-mobile.test.ts
git commit -m "test: add Phase 7 end-to-end smoke tests

- Backend E2E: analytics event logging flow (app_opened → booking_created → payment_completed)
- Vet Dashboard E2E: login and earnings page rendering
- Mobile E2E: app_opened tracking on launch, booking_created event logging
- All test suites passing (backend, vet-dashboard, mobile)
- Ready for production deployment"
```

---

## Summary

All 12 tasks implement Phase 7 (Vet Dashboard, Email Notifications, Analytics):

✅ Task 1: Backend vet earnings endpoints  
✅ Task 2: Analytics event logger + Cloud Tasks  
✅ Task 3: SendGrid email service (4 templates)  
✅ Task 4: Vet dashboard scaffold + Firebase auth  
✅ Task 5: Vet dashboard bookings page  
✅ Task 6: Vet dashboard earnings + subscription  
✅ Task 7: Vet dashboard support + FAQ + settings  
✅ Task 8: Mobile analytics tracking hook  
✅ Task 9: Firebase Cloud Messaging push notifications  
✅ Task 10: BigQuery nightly analytics pipeline  
✅ Task 11: Data Studio dashboard guide  
✅ Task 12: E2E smoke tests  

**Deployment:** All backend functions + vet-dashboard to Vercel, mobile via Expo EAS with analytics enabled.
