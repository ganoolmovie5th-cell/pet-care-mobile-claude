# Admin Panel Deployment Guide

## Vercel Deployment Steps

### 1. Connect GitHub Repository
- Go to https://vercel.com
- Click "New Project"
- Select GitHub repository: pet-care-mobile-claude
- Select project root: `admin/`

### 2. Environment Variables
Add in Vercel UI under Settings → Environment Variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDexamplekey123456789
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pet-care-prod
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pet-care-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pet-care-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop
```

### 3. Build & Deploy
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Root Directory: `admin/`

### 4. Custom Domain (Optional)
- Settings → Domains
- Add custom domain or use *.vercel.app subdomain

### 5. Post-Deploy
- Test login at https://admin.petcare.com (or assigned URL)
- Verify Firebase auth working
- Test user/vet/payment/dispute pages

## Local Testing
```bash
cd admin
npm install
npm run dev
# Open http://localhost:3001
```

## Rollback
Each deployment is versioned. Revert via Vercel Deployments tab.

## Monitoring
- Logs: Vercel Dashboard → Deployments → Logs
- Errors: Sentry integration optional (add after MVP)
