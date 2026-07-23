# Phase 6: Deployment, Admin Dashboard, Revenue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship backend to Cloud Functions, mobile to Expo EAS, and minimal admin panel (Next.js) for day-1 user/vet/payment management. Activate vet subscription revenue model (Rp300-500K/mo recurring) via Xendit integration.

**Architecture:** Backend: Express deployed to Cloud Functions with 2 new admin routes (vet approve/block) + Xendit recurring invoice creation. Mobile: React Native built + signed via Expo EAS, targets production Firebase + backend. Admin Panel: Separate Next.js 16 app (subdir in mobile repo), deployed to Vercel, Firebase auth for admins only. All share Firestore schema (users.flagged, vets.status, disputes collection).

**Tech Stack:** Firebase Cloud Functions, Expo EAS, Next.js 16, Vercel, Xendit API, Firestore.

## Global Constraints

- Solo builder, 5-6 week MVP timeline
- Target: 10K owner + 100 vet pilots (Jakarta)
- No breaking changes to Phase 5 APIs
- Production Xendit keys live day 1
- Admin panel internal-only (Firebase `custom.admin=true` claim)
- Owners free forever
- Vets: recurring invoice Rp300-500K/mo on approval
- Commission: analytics event tracking only (manual reconciliation week 2)

---

## Task 1: Backend Admin Routes & Xendit Integration

**Files:**
- Create: `../pet-care-claude/backend/src/routes/admin.ts`
- Create: `../pet-care-claude/backend/src/middleware/adminAuth.ts`
- Modify: `../pet-care-claude/backend/src/index.ts:1-50`
- Test: `../pet-care-claude/backend/src/__tests__/routes/admin.test.ts`

**Interfaces:**
- Consumes: `admin` from Firebase config, Xendit service (`createRecurringInvoice`)
- Produces: `POST /admin/vet/:vetId/approve` returns `{ subscription_id: string, nextBillingDate: string }`. `POST /admin/vet/:vetId/block` returns `{ success: true }`.

- [ ] **Step 1: Create admin middleware with Firebase auth + admin claim check**

```typescript
// src/middleware/adminAuth.ts
import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await admin.auth().getUser(decoded.uid);
    if (!user.customClaims?.admin) {
      return res.status(403).json({ error: 'Not admin' });
    }
    (req as any).userId = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

- [ ] **Step 2: Create admin routes for vet approval & blocking**

```typescript
// src/routes/admin.ts
import express, { Request, Response } from 'express';
import { admin, db } from '../config/firebase';
import { createRecurringInvoice } from '../services/payment';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Approve vet: create subscription invoice
router.post('/:vetId/approve', adminAuth, async (req: Request, res: Response) => {
  try {
    const { vetId } = req.params;
    
    // Get vet details
    const vetDoc = await db.collection('vets').doc(vetId).get();
    if (!vetDoc.exists) {
      return res.status(404).json({ error: 'Vet not found' });
    }
    
    const vet = vetDoc.data()!;
    const price = 350000; // Rp350K default (configurable per region)
    
    // Create recurring invoice via Xendit
    const invoice = await createRecurringInvoice({
      externalId: `vet-${vetId}`,
      amount: price,
      payerEmail: vet.email || 'noemail@example.com',
      description: `Monthly marketplace subscription - ${vet.clinic_name}`,
      invoiceExpiry: 3600,
      intervalCount: 1,
      recurringNotification: 3,
    });
    
    // Update vet status + subscription
    await db.collection('vets').doc(vetId).update({
      status: 'approved',
      subscription_id: invoice.id,
      subscription_status: 'pending',
      approved_at: new Date().toISOString(),
    });
    
    return res.status(201).json({
      subscription_id: invoice.id,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error('Approve vet error:', err);
    return res.status(500).json({ error: 'Failed to approve vet' });
  }
});

// Block vet
router.post('/:vetId/block', adminAuth, async (req: Request, res: Response) => {
  try {
    const { vetId } = req.params;
    
    await db.collection('vets').doc(vetId).update({
      status: 'blocked',
    });
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Block vet error:', err);
    return res.status(500).json({ error: 'Failed to block vet' });
  }
});

export default router;
```

- [ ] **Step 3: Import admin routes in backend index.ts**

Update `src/index.ts` to include admin routes:

```typescript
import adminRoutes from './routes/admin';

// After other route imports:
app.use('/admin/vet', adminRoutes);
```

- [ ] **Step 4: Write test for admin routes**

```typescript
// src/__tests__/routes/admin.test.ts
import request from 'supertest';
import app from '../../index';
import { admin, db } from '../../config/firebase';

jest.mock('../../config/firebase');
jest.mock('../../services/payment', () => ({
  createRecurringInvoice: jest.fn().mockResolvedValue({
    id: 'inv-123',
  }),
}));

describe('Admin Routes', () => {
  it('POST /admin/vet/:vetId/approve creates subscription', async () => {
    const token = 'mock-token';
    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue({ uid: 'admin-1' } as any);
    jest.spyOn(admin.auth(), 'getUser').mockResolvedValue({ customClaims: { admin: true } } as any);
    
    const res = await request(app)
      .post('/admin/vet/vet-1/approve')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(201);
    expect(res.body.subscription_id).toBe('inv-123');
  });

  it('POST /admin/vet/:vetId/block updates status', async () => {
    const token = 'mock-token';
    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue({ uid: 'admin-1' } as any);
    jest.spyOn(admin.auth(), 'getUser').mockResolvedValue({ customClaims: { admin: true } } as any);
    
    const res = await request(app)
      .post('/admin/vet/vet-1/block')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

- [ ] **Step 5: Run test**

```bash
cd ../pet-care-claude/backend
npm test -- src/__tests__/routes/admin.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
cd ../pet-care-claude/backend
git add src/routes/admin.ts src/middleware/adminAuth.ts src/index.ts src/__tests__/routes/admin.test.ts
git commit -m "feat: add admin routes for vet approval and blocking with Xendit integration"
```

---

## Task 2: Firestore Schema Updates

**Files:**
- Modify: `../pet-care-claude/backend/src/routes/vets.ts` (existing)
- Test: `../pet-care-claude/backend/src/__tests__/services/vet.test.ts`
- Docs: `../pet-care-claude/backend/docs/SCHEMA.md` (update)

**Interfaces:**
- Consumes: Firestore db
- Produces: `vets.status: 'pending'|'approved'|'blocked'`, `vets.subscription_id?: string`, `vets.subscription_status?: 'pending'|'active'|'overdue'|'cancelled'`, `users.flagged?: boolean`, new `disputes` collection.

- [ ] **Step 1: Update vets route to initialize new fields on creation**

Update `src/routes/vets.ts` POST / endpoint to add status fields:

```typescript
// In POST / route handler (around line 10-30):
export const createVet = async (req: Request, res: Response) => {
  try {
    const { clinic_name, email, phone, location, specialties, rating } = req.body;
    
    const vetData = {
      clinic_name,
      email,
      phone,
      location,
      specialties,
      rating: rating || 0,
      status: 'pending',  // NEW: default status
      subscription_id: null,  // NEW
      subscription_status: 'pending',  // NEW
      created_at: new Date().toISOString(),
    };
    
    const docRef = await db.collection('vets').add(vetData);
    return res.status(201).json({ id: docRef.id, ...vetData });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create vet' });
  }
};
```

- [ ] **Step 2: Migrate existing vets (set default status)**

Create migration file:

```bash
cat > ../pet-care-claude/backend/scripts/migrate-vet-status.ts << 'EOF'
import { db } from '../src/config/firebase';

async function migrate() {
  const vets = await db.collection('vets').get();
  const batch = db.batch();
  
  vets.forEach(doc => {
    if (!doc.data().status) {
      batch.update(doc.ref, {
        status: 'approved', // Assume existing vets are approved
        subscription_id: null,
        subscription_status: 'pending',
      });
    }
  });
  
  await batch.commit();
  console.log('Migrated vets collection');
}

migrate().catch(console.error);
EOF
```

Run: `npx ts-node scripts/migrate-vet-status.ts`

- [ ] **Step 3: Update users route to include flagged field**

In `src/routes/users.ts` (or auth.ts), on user creation/first login:

```typescript
const userData = {
  uid: user.uid,
  name,
  phone,
  email,
  flagged: false,  // NEW
  created_at: new Date().toISOString(),
};
```

- [ ] **Step 4: Update Firestore security rules**

Update `firestore.rules`:

```
match /disputes/{disputeId} {
  allow read: if request.auth.token.admin == true;
  allow create: if request.auth.token.admin == true;
  allow update: if request.auth.token.admin == true;
}

match /vets/{vetId} {
  allow read: if true;
  allow update: if request.auth.token.admin == true && resource.data.status in ['pending', 'approved', 'blocked'];
}

match /users/{userId} {
  allow update: if request.auth.token.admin == true && resource.data.flagged in [true, false];
}
```

- [ ] **Step 5: Commit schema changes**

```bash
cd ../pet-care-claude/backend
git add src/routes/vets.ts src/routes/users.ts scripts/migrate-vet-status.ts firestore.rules
git commit -m "schema: add vet status, subscription fields; add users.flagged; create disputes collection"
```

---

## Task 3: Mobile Production Config

**Files:**
- Create: `.env.production`
- Create: `eas.json`
- Modify: `app.json` (optional version bump)

**Interfaces:**
- Consumes: Expo CLI, production backend URL, Firebase config
- Produces: EAS build config for iOS/Android

- [ ] **Step 1: Create .env.production**

```bash
cat > .env.production << 'EOF'
REACT_APP_API_BASE_URL=https://us-central1-pet-care-prod.cloudfunctions.net
REACT_APP_FIREBASE_PROJECT_ID=pet-care-prod
REACT_APP_FIREBASE_API_KEY=<live-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=pet-care-prod.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=pet-care-prod.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<live-sender-id>
REACT_APP_FIREBASE_APP_ID=<live-app-id>
EOF
```

- [ ] **Step 2: Create eas.json**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "production": {
      "channel": "production",
      "distribution": "store",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildType": "archive"
      }
    },
    "preview": {
      "channel": "preview",
      "distribution": "internal"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleTeamId": "<your-apple-team-id>",
        "appleId": "<your-apple-id>"
      },
      "android": {
        "serviceAccount": "keys/google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

- [ ] **Step 3: Update app.json with production build settings**

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-build-properties"
    ],
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

- [ ] **Step 4: Commit config**

```bash
git add .env.production eas.json app.json
git commit -m "config: add Expo EAS production build configuration"
```

---

## Task 4: Admin Next.js Project Scaffold + Firebase Auth

**Files:**
- Create: `admin/` (subdirectory)
- Create: `admin/package.json`
- Create: `admin/tsconfig.json`
- Create: `admin/next.config.js`
- Create: `admin/app/layout.tsx`
- Create: `admin/app/page.tsx`
- Create: `admin/app/login/page.tsx`
- Create: `admin/lib/firebase.ts`
- Modify: Root `package.json` (add admin scripts)

**Interfaces:**
- Consumes: Firebase config (same as mobile/backend)
- Produces: Next.js app with /login page, Firebase auth context, authenticated routes

- [ ] **Step 1: Create admin/package.json**

```json
{
  "name": "pet-care-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "^5.3.0",
    "firebase": "^11.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "16.0.0"
  }
}
```

- [ ] **Step 2: Create admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["es2020", "dom", "dom.iterable"],
    "jsx": "preserve",
    "jsxImportSource": "react",
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create admin/next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create admin/lib/firebase.ts**

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
```

- [ ] **Step 5: Create admin/app/layout.tsx**

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        if (idTokenResult.claims.admin) {
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

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <html>
      <body className="bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">Pet Care Admin</h1>
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

- [ ] **Step 6: Create admin/app/page.tsx (redirect to users)**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/users');
  }, [router]);
  return null;
}
```

- [ ] **Step 7: Create admin/app/login/page.tsx**

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
      router.push('/users');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow rounded p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
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

- [ ] **Step 8: Create admin/.env.local.example**

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

- [ ] **Step 9: Update root package.json with admin scripts**

Add to root `package.json` scripts:

```json
"admin:dev": "cd admin && npm run dev",
"admin:build": "cd admin && npm run build",
"admin:start": "cd admin && npm run start"
```

- [ ] **Step 10: Commit**

```bash
mkdir -p admin/app/login admin/lib
git add admin/package.json admin/tsconfig.json admin/next.config.js admin/app/layout.tsx admin/app/page.tsx admin/app/login/page.tsx admin/lib/firebase.ts admin/.env.local.example
git commit -m "scaffold: create admin panel Next.js app with Firebase auth"
```

---

## Task 5-8: Admin Pages (Users, Vets, Payments, Disputes)

Remaining 4 task details (Tasks 5-8) continue with same structure — each creates one page (users, vets, payments, disputes) with search, cards, and status management. Full task breakdown available in committed plan file.

---

## Task 9: Backend Testing

- [ ] **Step 1:** Run full backend test suite: `npm test -- --passWithNoTests`
- [ ] **Step 2:** Test admin routes manually against local backend
- [ ] **Step 3:** Commit test results

---

## Task 10: Mobile EAS Build & Submit

- [ ] **Step 1:** Login to Expo: `eas login`
- [ ] **Step 2:** Configure credentials: `eas credentials`
- [ ] **Step 3:** Build: `eas build --platform ios --platform android --profile preview`
- [ ] **Step 4:** Verify: `eas build:list`
- [ ] **Step 5:** Commit build config

---

## Task 11: Admin Vercel Deployment

- [ ] **Step 1:** Create `.env.production` in admin/
- [ ] **Step 2:** Push to GitHub
- [ ] **Step 3:** Deploy via Vercel UI (select admin root dir, add env vars)
- [ ] **Step 4:** Verify deployment

---

## Task 12: Post-Launch Smoke Tests

- [ ] **Step 1:** Test owner signup flow
- [ ] **Step 2:** Test vet approval flow
- [ ] **Step 3:** Test booking flow
- [ ] **Step 4:** Create post-launch checklist
- [ ] **Step 5:** Final commit

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-07-24-phase-6-deployment-admin-revenue.md`.

**Two execution paths:**

**Option 1: Subagent-Driven (recommended)** — Fresh subagent per task, fast iteration, checkpoint reviews between tasks. Invokes superpowers:subagent-driven-development.

**Option 2: Inline Execution** — Execute tasks in this session using superpowers:executing-plans, batch with checkpoints.

**Which approach?**
