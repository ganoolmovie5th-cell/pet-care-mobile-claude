# Phase 6 Post-Launch Smoke Tests

## Pre-Launch Checklist

### Backend (Cloud Functions)
- [ ] `/admin/vet/:vetId/approve` route responds with 201
- [ ] `/admin/vet/:vetId/block` route responds with 200
- [ ] Admin middleware rejects non-admin users (403)
- [ ] Admin middleware rejects missing tokens (401)
- [ ] Xendit subscription invoice created on approve
- [ ] Vet status updated to 'approved' in Firestore

### Mobile (Expo EAS)
- [ ] App builds without TypeScript errors
- [ ] App loads Firebase config from .env.production
- [ ] Auth flow works (phone OTP → dashboard)
- [ ] Backend API calls use production URL
- [ ] Offline sync queue functions
- [ ] Push notifications trigger on events

### Admin (Next.js)
- [ ] Admin app builds without errors
- [ ] Login page loads
- [ ] Firebase auth rejects non-admin users
- [ ] Users page loads and lists all users
- [ ] Vets page loads and shows approve/block buttons
- [ ] Approve vet calls backend and updates status
- [ ] Block vet updates Firestore status
- [ ] Payments page loads with filter buttons
- [ ] Disputes page loads and shows open disputes
- [ ] Admin can resolve/reject disputes

---

## Critical User Journey Tests

### 1. Owner Signup → Booking → Payment
```
START: Fresh device, no Firebase account
1. App opens → redirect to OTP screen
2. Enter phone +62812345678
3. Request OTP → SMS delivered (check Firebase logs)
4. Enter OTP code → ID token generated
5. Create profile (name, email)
6. See vet browse page
7. Click vet → see details + booking button
8. Create booking (date, time)
9. Pay Rp150K → Xendit widget opens
10. Complete payment → booking status = 'paid'
11. See booking in "My Bookings"
END: Booking confirmed, owner can reschedule
```

### 2. Admin Approves Vet for Subscription
```
START: Vet signed up, status='pending'
1. Admin opens admin.petcare.com
2. Login with admin account
3. Navigate to Vets page
4. Find vet in 'pending' list
5. Click "Approve"
6. Backend calls Xendit → recurring invoice created
7. Vet status changes to 'approved'
8. Vet sees subscription_status='pending'
END: Xendit invoice queued, vet invoiced monthly
```

### 3. Owner Flags Vet (Dispute)
```
START: Owner has bad experience
1. Navigate to booking history
2. Click "Report Issue" on booking
3. Select reason (vet rude, incorrect treatment, no-show)
4. Submit dispute
5. Firestore creates disputes/{disputeId}
6. Admin sees new dispute on Disputes page
7. Admin clicks "Resolve" → status='resolved'
8. Owner gets push notification
END: Dispute tracked, resolvable
```

### 4. Offline Mode → Sync
```
START: Good network
1. User creates booking (stored Firestore)
2. Toggle airplane mode
3. User adds health record (local cache only)
4. See "sync pending" indicator
5. Toggle airplane mode off
6. App detects reconnect
7. Sync queue plays back
8. Health record appears in Firestore
END: Offline mutations sync on reconnect
```

---

## Manual Verification Points

### Firestore Collections
```
✓ users/{userId}.flagged exists and is boolean
✓ vets/{vetId}.status in ['pending', 'approved', 'blocked']
✓ vets/{vetId}.subscription_id is string or null
✓ vets/{vetId}.subscription_status in ['pending', 'active', 'overdue', 'cancelled']
✓ disputes/{disputeId} created on report
✓ bookings/{bookingId}.payment_status tracks Xendit webhook
```

### Firebase Rules
```
✓ /admin/* endpoints return 403 for non-admin
✓ vets/{vetId} readable by all, writable by admin only
✓ users/{userId} readable by owner, writable by owner
✓ disputes/{disputeId} readable/writable by admin only
```

### Xendit Integration
```
✓ Live API key in backend env
✓ Test invoice created on /admin/vet/{id}/approve
✓ Webhook listener handles payment updates
✓ Recurring interval set to 30 days
✓ Amount is Rp350K (or configurable per vet)
```

### Performance
```
✓ Admin users page loads < 2s (100+ users)
✓ Mobile app cold start < 3s
✓ Vet search returns results < 1s (50+ vets)
✓ Booking creation completes < 2s
```

---

## Rollback Plan

If critical issue found:
1. **Backend:** Redeploy previous commit to Cloud Functions
2. **Mobile:** Revert to previous EAS build
3. **Admin:** Revert via Vercel Deployments

Test rollback procedure before launch.
