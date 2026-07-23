# Phase 6 Deployment Runbook

## Prerequisites Checklist

```bash
# 1. Verify all code committed
git status
# Should show: "working tree clean"

# 2. Check Node versions
node --version  # Should be 18+
npm --version   # Should be 9+

# 3. Verify Firebase project
firebase projects:list
# Should show: pet-care-prod

# 4. Verify Expo account
eas whoami
# Should show email

# 5. Verify Vercel CLI
vercel --version
# Should be installed
```

---

## Step 1: Deploy Backend to Cloud Functions (30 min)

```bash
# 1a. Navigate to backend
cd ../pet-care-claude/backend

# 1b. Verify environment
cat .env
# Should have XENDIT_API_KEY (live key)

# 1c. Build backend
npm run build

# 1d. Run tests one final time
npm test

# Expected output:
# Test Suites: 2 passed, 2 total
# Tests:       8 passed, 8 total

# 1e. Deploy to Cloud Functions
firebase deploy --only functions --project pet-care-prod

# Wait for:
# ✔ functions[adminAuth]: Successful create operation.
# ✔ functions[vetApprove]: Successful create operation.
# ✔ functions[vetBlock]: Successful create operation.

# 1f. Test health endpoint
curl https://us-central1-pet-care-prod.cloudfunctions.net/health
# Should return 200 OK

# 1g. Verify admin routes exist
curl -X POST https://us-central1-pet-care-prod.cloudfunctions.net/admin/vet/test-vet-id/approve \
  -H "Authorization: Bearer invalid-token"
# Should return 401 Unauthorized (correct: token rejected, not 404)
```

---

## Step 2: Deploy Admin to Vercel (15 min)

```bash
# 2a. Verify admin app builds locally
cd admin
npm install
npm run build
# Should complete with no errors

# 2b. Push to GitHub
cd ../..
git push origin main

# 2c. Connect to Vercel UI
# - Open https://vercel.com
# - Click "New Project"
# - Select pet-care-mobile-claude repo
# - Set Root Directory: admin/
# - Add Environment Variables:
#   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDexamplekey123456789
#   NEXT_PUBLIC_FIREBASE_PROJECT_ID=pet-care-prod
#   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pet-care-prod.firebaseapp.com
#   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pet-care-prod.appspot.com
#   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
#   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop

# 2d. Click Deploy
# Wait for:
# ✔ Build Complete
# ✔ Live at: https://admin-[hash].vercel.app

# 2e. Test admin login
# - Open deployment URL
# - Try login with admin account
# - Should redirect to /users on success
# - Should show "not admin" error on non-admin account
```

---

## Step 3: Build Mobile via EAS (45 min)

```bash
# 3a. Verify mobile config
cat .env.production
# Should have:
# REACT_APP_API_BASE_URL=https://us-central1-pet-care-prod.cloudfunctions.net
# Firebase keys (same as admin)

cat eas.json
# Should have build.production config

# 3b. Login to Expo/EAS
eas login
# Enter email + password

# 3c. Setup credentials (one-time)
eas credentials

# Follow prompts for iOS/Android:
# - iOS: Will ask for Apple Team ID, certificates
# - Android: Will ask for keystore

# 3d. Build preview (test first)
eas build --platform ios --platform android --profile preview

# Wait for builds to complete
# Check status:
eas build:list

# When ready, download builds and test on TestFlight (iOS) / internal (Android)

# 3e. Once preview tested, build production
eas build --platform ios --platform android --profile production

# Wait ~30-45 min for both builds
# Monitor:
eas build:view <build-id>
```

---

## Step 4: Run Smoke Tests (30 min)

See docs/SMOKE_TESTS.md for full checklist.

**Critical Path (5 min minimum):**

```bash
# 4a. Backend routes work
curl -X POST https://us-central1-pet-care-prod.cloudfunctions.net/admin/vet/test/approve \
  -H "Authorization: Bearer $(firebase auth:export --project pet-care-prod /tmp/users.json && echo 'token-here')"
# Should return 201 or 403 (auth check working)

# 4b. Admin dashboard responsive
# - Open https://admin-[hash].vercel.app/login
# - Login with admin account
# - Navigate to /users, /vets, /payments, /disputes
# - Each page should load < 2s

# 4c. Mobile app starts
# - Install APK or TestFlight build
# - App should not crash on startup
# - Should redirect to OTP screen (no logged-in user)
# - Phone OTP should send SMS (check logs)

# 4d. Vet approval flow
# - Create test vet in Firestore (status: pending)
# - Admin: Navigate to /vets
# - Click "Approve" on test vet
# - Verify:
#   - Vet status changed to 'approved'
#   - Xendit invoice created (check Firebase logs)
```

---

## Step 5: Go Live (Decision Point)

**Go/No-Go Checklist:**

```
✅ Backend health check passes
✅ All admin pages load < 2s
✅ Mobile app starts without crash
✅ Vet approval triggers Xendit invoice
✅ Firestore collections exist + data correct
✅ Firebase rules allow only admin edits
✅ All logs clean (no 5xx errors)
✅ At least 1 test user → test booking → payment
```

If all ✅:
```bash
# 5a. Final backup
firebase firestore:export gs://pet-care-prod-backups/pre-launch-$(date +%Y%m%d)

# 5b. Enable production notifications
firebase functions:config:set notifications.enabled=true

# 5c. Send comms to early users
# "Launching today 9:00 AM. Download app from TestFlight"

# 5d. Monitor for first 3 hours
# - Watch Firebase logs
# - Check Xendit payment webhook delivery
# - Monitor Firestore read/write ops
# - Check app crash reports

# 5e. Daily check for first week
# Dashboard: https://console.firebase.google.com/project/pet-care-prod
```

---

## Troubleshooting

### Firebase Deploy Fails
```bash
# Check Cloud Functions quota
firebase functions:describe

# Verify service account has permissions
gcloud auth list
gcloud auth activate-service-account --key-file=key.json

# Try again with verbose
firebase deploy --only functions --debug
```

### Vercel Build Fails
```bash
# Check build logs in Vercel UI (Deployments tab)
# Common issues:
# - Missing env vars: Settings → Environment Variables
# - TypeScript errors: Run `npm run build` locally first
# - Node version mismatch: Check Node version in Vercel settings
```

### EAS Build Fails
```bash
# Check build logs
eas build:view <build-id>

# Common issues:
# - Credentials expired: Run `eas credentials` again
# - Code signing: Check iOS/Android certificates in EAS
# - Dependency error: Run `npm install` locally, push new commit

# Retry build
eas build --platform ios --profile production
```

### Mobile App Crash on Startup
```bash
# Check Firebase init
cat src/services/firebase.ts
# Verify apiKey, projectId match .env.production

# Check imports
grep -r "import.*firebase" src/ | grep -v node_modules

# Test auth
npm run test -- --testNamePattern="auth"
```

### Admin Login Fails
```bash
# Verify Firebase project same as mobile
# Check custom claim set on admin user:
firebase auth:export --project pet-care-prod /tmp/users.json

# Should see custom.admin=true on test user
# If missing, set via Firebase console:
# Users → Select user → Custom Claims → Add {"admin": true}
```

---

## Rollback (If Critical Issue)

```bash
# 1. Backend
cd ../pet-care-claude/backend
git revert <commit-hash>
firebase deploy --only functions

# 2. Admin
# Click "Revert to Previous" in Vercel Deployments

# 3. Mobile
# TestFlight: Reject current build
# Play Store: Delete build from internal track
# Create new build from previous stable commit

# After rollback, investigate root cause:
git log --oneline --grep="<issue>"
git diff <broken-commit>~1 <broken-commit>
```

---

## Success = Day 1 Completion

```
✅ 10+ owners signed up
✅ 3+ vets approved
✅ 2+ bookings completed
✅ 1+ payment successful
✅ 0 critical bugs in logs
✅ All pages responsive
✅ Admin can approve vets
```

If achieved → Phase 6 done. Start Week 2 improvements.
