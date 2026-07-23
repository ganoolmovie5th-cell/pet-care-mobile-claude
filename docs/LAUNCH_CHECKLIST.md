# Phase 6 Launch Checklist

## 1 Week Before Launch

### Backend
- [ ] Cloud Functions deployment tested in staging
- [ ] Admin routes responding correctly
- [ ] Xendit live API keys configured
- [ ] Database backups automated
- [ ] Monitoring/alerts set up (Firebase, Sentry)
- [ ] Rate limiting configured on /admin/* endpoints

### Mobile
- [ ] EAS preview build tested on 3+ devices
- [ ] .env.production verified with correct URLs
- [ ] Firebase production project linked
- [ ] Push notifications tested
- [ ] Offline sync tested
- [ ] App icons and splash screens finalized

### Admin
- [ ] Vercel deployment tested
- [ ] Firebase auth test account created
- [ ] All 4 pages tested (users, vets, payments, disputes)
- [ ] Admin claim set on test user in Firebase
- [ ] Custom domain configured (optional)
- [ ] Email notifications configured (optional)

---

## Launch Day

### 24 Hours Before
- [ ] Backend: Final data migration (vets → approve existing, set status)
- [ ] Mobile: Final EAS production build submitted
- [ ] Admin: Final Vercel deployment
- [ ] Comms: Notify early access users
- [ ] Backup: Full Firestore snapshot

### Launch (Go/No-Go)

**Go Criteria:**
- Backend health check passes
- Mobile build approved by stores (or ready for internal testing)
- Admin dashboard accessible
- All smoke tests pass

**No-Go Triggers:**
- Any endpoint returns 5xx
- Admin can't approve vets
- Mobile app crashes on startup
- Firebase performance issues

### Launch Actions
1. **8:00 AM:** Final health check
2. **8:30 AM:** Enable all notification listeners
3. **9:00 AM:** Announce launch to beta testers (Slack, email)
4. **9:00-12:00 PM:** Monitor logs in real-time
5. **12:00 PM:** Check first 10 bookings
6. **EOD:** Summarize metrics

### Post-Launch (Week 1)

#### Daily Checks
- [ ] No critical errors in logs
- [ ] Payment flow working (Xendit webhooks received)
- [ ] Admin approvals processed
- [ ] User complaints addressed

#### Day 3
- [ ] 10+ owners signed up
- [ ] 5+ vets approved
- [ ] 2+ bookings completed
- [ ] First payment received

#### Day 7
- [ ] 50+ owners, 20+ vets
- [ ] 10+ bookings completed
- [ ] App store ratings > 4.0
- [ ] 0 critical bugs
- [ ] Replan Week 2 based on feedback

---

## Critical Contacts

```
Backend Issues: [deploy engineer]
Mobile Issues: [mobile engineer]
Admin Issues: [admin engineer]
Payment Issues: [Xendit support]
Firebase Issues: [Google Cloud support]
App Store Issues: [Apple App Store]
Play Store Issues: [Google Play]
```

## Rollback Procedure

If critical production issue:

1. **Identify problem** (logs, user report, metrics)
2. **Severity triage:** Critical/Urgent/Normal
3. **Execute rollback:**
   - Backend: `firebase deploy --only functions`
   - Mobile: Create new EAS build, notify TestFlight
   - Admin: Vercel "Revert to Previous" button
4. **Post-mortem:** After 24h, analyze root cause
5. **Prevention:** Add regression test before re-deploying

---

## Success Metrics

### Week 1 Targets
- Signups: 100+
- Approved vets: 20+
- Bookings: 10+
- Payment success rate: > 90%
- App crash rate: < 1%
- Admin uptime: > 99%

### Week 2 Targets
- Signups: 500+
- Approved vets: 50+
- Bookings: 50+
- Payment success rate: > 95%
- Daily active users: 100+
- Net Promoter Score: 40+

---

## Post-Launch Notes

- Monitor Firestore read/write costs
- Track user feedback in a central channel
- Weekly metrics review with team
- Plan Week 3-4 improvements based on usage
