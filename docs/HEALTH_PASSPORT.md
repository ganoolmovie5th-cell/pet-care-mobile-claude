# Health Passport Feature

## Overview

Health Passport is a comprehensive pet health tracking system enabling owners to manage vaccination schedules, receive SMS and push reminders, track health records, and access vet booking suggestions. The system combines breed-specific vaccination defaults with daily automated checks, user preference management, and audit logging for regulatory compliance.

**Key Capabilities:**
- Extended pet profiles (microchip, blood type, allergies, insurance, emergency contacts)
- Automated vaccination schedule calculation based on breed and age
- Daily cron job checks for due/overdue vaccines
- Dual-channel reminders (SMS + push) with user preferences
- Smart vet booking suggestions for overdue vaccines
- Comprehensive audit trail of all health data changes
- Offline-first mobile sync with AsyncStorage caching

---

## Architecture

### Backend Stack

**Framework & Runtime:**
- Express.js with Firebase Cloud Functions (Node.js 18+)
- TypeScript with strict mode
- Firestore for document persistence

**Key Components:**

1. **Vaccine Calculator** (`backend/src/services/vaccine-calculator.ts`)
   - Breed-specific vaccination defaults
   - Age-based schedule generation
   - Status determination (completed, upcoming, due_soon, overdue)
   - Extensible vaccine registry per breed

2. **Health Service** (`backend/src/services/health.ts`)
   - Pet profile CRUD operations
   - Vaccination schedule management and recalculation
   - Health record creation and retrieval
   - Audit event logging for all mutations

3. **Reminders Service** (`backend/src/services/reminders.ts`)
   - Reminder preference management (SMS/push channels, timing, muted vaccines)
   - Reminder creation and status tracking
   - Preference defaults (SMS + push enabled, 7 days before due)

4. **Booking Suggestions Service** (`backend/src/services/booking-suggestions.ts`)
   - Suggestion creation for overdue vaccines
   - User acceptance/dismissal tracking
   - Pet ownership validation

5. **Cron Job** (`backend/src/cron/check-vaccinations.ts`)
   - Daily vaccination status check (Cloud Scheduler trigger)
   - Reminder creation for due/overdue vaccines
   - SMS dispatch via Twilio (stubbed; SMS helper function ready for implementation)
   - Booking suggestion creation for overdue vaccines
   - Comprehensive failure tracking and logging

6. **Audit Log Service** (`backend/src/services/audit-log.ts`)
   - Immutable event recording (timestamp, actor, action, before/after state)
   - Compliance with health data regulations

### Mobile Stack

**Framework & Runtime:**
- React Native 0.73+ with Expo 50+
- TypeScript for type safety
- AsyncStorage for offline caching

**Screens:**

1. **PetProfileScreen** (`src/screens/health/PetProfileScreen.tsx`)
   - Displays pet card with extended metadata
   - Navigation hub to vaccination, health records, emergency contacts

2. **EditPetProfileScreen** (`src/screens/health/EditPetProfileScreen.tsx`)
   - Form for updating all pet fields
   - Triggers schedule recalculation on breed/birthdate change
   - Validation on input (date format, numeric fields)

3. **VaccinationDashboardScreen** (`src/screens/health/VaccinationDashboardScreen.tsx`)
   - Grouped vaccine status display (Up-to-Date, Due Soon, Overdue, Completed)
   - Real-time sync via Firestore listener
   - Mark vaccine complete action with vet details

4. **ReminderPreferencesScreen** (`src/screens/health/ReminderPreferencesScreen.tsx`)
   - SMS/push channel toggles
   - Reminder timing slider (1–30 days before due)
   - Vaccine muting list management

5. **BookingSuggestionScreen** (`src/screens/health/BookingSuggestionScreen.tsx`)
   - Lists overdue vaccines requiring booking
   - Vet and date selection
   - Navigation to BookingScreen with pre-filled context

6. **AddRecordScreen** (`src/screens/health/AddRecordScreen.tsx`)
   - Pet health record creation (vaccine, checkup, medication, surgery)
   - Integration with booking confirmation flow

**Services:**

- `src/services/health.ts` — API wrappers for pet, vaccination, reminder, booking endpoints
- AsyncStorage caching for pet profiles and vaccination schedules
- Axios instance with auth header injection

**Hooks:**

- `useVaccinationSchedule(petId)` — Returns { schedule, loading, error, refetch }
- `useReminderPreferences()` — Returns { prefs, loading, updatePrefs, error }
- `useBookingSuggestions(petId)` — Returns { suggestions, loading, acceptSuggestion }

---

## Data Model

### Firestore Collections

#### `pets/{petId}`

Core pet profile with extended health metadata.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ownerId` | string | yes | Owner isolation; indexed for queries |
| `name` | string | yes | Pet display name |
| `breed` | string | yes | Vaccination lookup key; indexed |
| `birthdate` | string (ISO) | yes | Age calculation; triggers recalc if changed |
| `age` | number | no | Computed from birthdate |
| `photo` | string (URL) | no | Pet image reference |
| `microchip` | string | no | Microchip ID for identification |
| `weight` | number | no | Weight in kg for vet record context |
| `color` | string | no | Physical description |
| `bloodType` | enum (A, B, AB, O) | no | Emergency medical reference |
| `allergies` | string[] | no | Allergy tracking for vet safety |
| `insuranceId` | string | no | Insurance provider reference |
| `emergencyContact` | object | no | Contact { name: string, phone: string } |
| `vetRelationships` | array | no | [ { vetId, clinicName, lastVisit } ] — not yet exposed in screens |
| `createdAt` | timestamp | auto | Record creation timestamp |

**Indexes:**
- `ownerId` (equality + order by createdAt)
- `breed` (equality)

#### `vaccination_schedules/{scheduleId}`

Breed-specific vaccination schedule calculated on pet creation or profile update.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `petId` | string | yes | Reference to pet |
| `petName` | string | yes | Denormalized for audit readability |
| `breed` | string | yes | Denormalized for audit readability |
| `vaccines` | array | yes | Array of vaccine objects (see below) |
| `calculatedAt` | timestamp | auto | Last calculation time |
| `updatedAt` | timestamp | auto | Last modification time |

**Vaccine Object:**
```json
{
  "id": "rabies",
  "name": "Rabies",
  "lastDate": "2023-01-15",  // null if never completed
  "nextDueDate": "2024-01-15",
  "status": "due_soon",  // completed | upcoming | due_soon | overdue
  "frequency": "annual"  // annual | 3-year | booster
}
```

**Indexes:**
- `petId` (equality)

#### `reminders/{reminderId}`

Reminder instances created by cron job for each due vaccine.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `petId` | string | yes | Reference to pet |
| `vaccineId` | string | yes | vaccine.id from schedule |
| `dueDate` | string (ISO) | yes | Vaccine's nextDueDate |
| `status` | enum | yes | pending \| sent \| dismissed \| cancelled |
| `reminderChannels` | array | yes | [ "sms", "push" ] |
| `sentAt` | timestamp | no | Delivery confirmation time |
| `readAt` | timestamp | no | User read receipt (future) |
| `createdAt` | timestamp | auto | Reminder creation time |

**Indexes:**
- `petId` (equality + order by dueDate)
- `status` (equality)

#### `reminderPreferences/{userId}`

User-level reminder configuration (one doc per owner).

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `ownerId` | string | yes | — | Owner reference |
| `smsEnabled` | boolean | yes | true | Twilio SMS dispatch toggle |
| `pushEnabled` | boolean | yes | true | Firebase Cloud Messaging toggle |
| `reminderDaysBefore` | number | yes | 7 | Days before due date (1–30) |
| `mutedVaccines` | string[] | yes | [] | vaccine.ids to skip reminders for |
| `updatedAt` | timestamp | auto | — | Last preference update |

**Indexes:**
- `ownerId` (unique; used as document ID)

#### `bookingSuggestions/{suggestionId}`

Proactive suggestions for overdue vaccines (created by cron job).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `petId` | string | yes | Reference to pet |
| `overdueVaccines` | string[] | yes | Array of vaccine.ids overdue |
| `suggestedDate` | string (ISO) | yes | Proposed booking date (tomorrow) |
| `vetId` | string | no | Recommended vet (future feature) |
| `status` | enum | yes | pending \| accepted \| dismissed |
| `createdAt` | timestamp | auto | Suggestion generation time |
| `acceptedAt` | timestamp | no | User acceptance time |

**Indexes:**
- `petId` (equality + order by createdAt)
- `status` (equality)

#### `auditLogs/{logId}`

Immutable change tracking for compliance and debugging.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `petId` | string | yes | Pet context (or ownerId for preference changes) |
| `actor` | string | yes | "user" \| "system" (cron job) |
| `action` | string | yes | "update_pet_profile", "recalculate_schedule", "reminder_dismissed", etc. |
| `before` | object | no | Previous state (null for creation) |
| `after` | object | no | New state (null for deletion) |
| `timestamp` | timestamp | auto | Change timestamp |

**Indexes:**
- `petId` (equality + order by timestamp)
- `actor` (equality)

---

## API Endpoints

### Pet Profile Management

#### `POST /health/pets`

Create a new pet with extended metadata.

**Request:**
```json
{
  "name": "Bella",
  "breed": "Golden Retriever",
  "birthdate": "2022-01-15",
  "weight": 25,
  "color": "cream",
  "bloodType": "A",
  "allergies": ["chicken", "corn"],
  "microchip": "ABC123DEF456",
  "insuranceId": "POL-123456",
  "emergencyContact": {
    "name": "Mom",
    "phone": "+62812345678"
  }
}
```

**Response:**
```json
{
  "id": "pet_abc123",
  "createdAt": "2026-07-24T10:00:00Z"
}
```

**Auth:** Firebase token with ownerId claim (automatically added)
**Side Effects:** Triggers vaccination schedule calculation

#### `GET /health/pets/:petId`

Fetch full pet profile.

**Response:** Pet object (all fields)

**Auth:** Firebase token; ownerId check enforced
**Status:** 404 if pet not found or doesn't belong to user

#### `PATCH /health/pets/:petId`

Update pet fields. Any subset of fields accepted.

**Request:**
```json
{
  "weight": 26,
  "breed": "Mixed Breed"  // Triggers schedule recalc
}
```

**Response:**
```json
{ "success": true }
```

**Side Effects:** If `breed` or `birthdate` changed, recalculates vaccination schedule

### Vaccination Schedule

#### `GET /health/pets/:petId/vaccination-schedule`

Fetch the current vaccination schedule for a pet.

**Response:**
```json
{
  "petId": "pet_abc123",
  "petName": "Bella",
  "breed": "Golden Retriever",
  "vaccines": [
    {
      "id": "rabies",
      "name": "Rabies",
      "lastDate": "2023-01-15",
      "nextDueDate": "2024-01-15",
      "status": "due_soon",
      "frequency": "annual"
    },
    {
      "id": "dhpp",
      "name": "DHPP",
      "lastDate": null,
      "nextDueDate": "2026-08-15",
      "status": "upcoming",
      "frequency": "3-year"
    }
  ],
  "calculatedAt": "2026-07-24T10:00:00Z",
  "updatedAt": "2026-07-24T10:00:00Z"
}
```

**Status:** 404 if schedule not yet calculated

#### `PATCH /health/vaccination-schedules/:scheduleId/vaccines/:vaccineId`

Mark a vaccine as completed.

**Request:**
```json
{
  "lastDate": "2026-07-24",
  "vetName": "Dr. Smith",
  "notes": "No side effects"
}
```

**Response:**
```json
{ "success": true }
```

**Side Effects:**
- Updates vaccine record with completion date
- Cancels related pending reminders
- Creates health record entry
- Logs audit event

### Reminders & Preferences

#### `GET /health/reminders/preferences`

Fetch user's reminder configuration.

**Response:**
```json
{
  "ownerId": "user_123",
  "smsEnabled": true,
  "pushEnabled": true,
  "reminderDaysBefore": 7,
  "mutedVaccines": ["lepto"],
  "updatedAt": "2026-07-23T14:30:00Z"
}
```

**Auth:** Firebase token; uses ownerId from token

#### `PATCH /health/reminders/preferences`

Update reminder preferences.

**Request:**
```json
{
  "smsEnabled": false,
  "reminderDaysBefore": 14,
  "mutedVaccines": ["lepto", "bordetella"]
}
```

**Response:**
```json
{ "success": true }
```

#### `GET /health/reminders`

List all reminders for user's pets.

**Response:**
```json
{
  "reminders": [
    {
      "id": "reminder_123",
      "petId": "pet_abc123",
      "vaccineId": "rabies",
      "dueDate": "2026-08-15",
      "status": "pending",
      "reminderChannels": ["sms", "push"],
      "createdAt": "2026-07-24T10:00:00Z"
    }
  ]
}
```

**Filtering:** Supports status query param (pending, sent, dismissed)

#### `POST /health/reminders/:reminderId/dismiss`

User dismisses a reminder.

**Response:**
```json
{ "success": true }
```

**Status:** 404 if reminder not found or doesn't belong to user's pet

### Booking Suggestions

#### `GET /health/pets/:petId/booking-suggestions`

List booking suggestions for a pet.

**Response:**
```json
{
  "suggestions": [
    {
      "id": "suggest_123",
      "petId": "pet_abc123",
      "overdueVaccines": ["rabies", "dhpp"],
      "suggestedDate": "2026-07-25",
      "status": "pending",
      "createdAt": "2026-07-24T10:00:00Z"
    }
  ]
}
```

#### `POST /health/booking-suggestions/:suggestionId/accept`

Accept a booking suggestion.

**Response:**
```json
{ "success": true }
```

**Side Effects:**
- Updates suggestion status to "accepted"
- Records acceptance timestamp
- Mobile app navigates to BookingScreen with pre-filled pet + vaccine context

### Scheduled Cron Job

#### `POST /health/cron/check-vaccinations`

**Trigger:** Cloud Scheduler daily at 1 AM UTC

**Algorithm:**
1. Iterate all pets in Firestore
2. For each pet:
   - Fetch vaccination schedule
   - Identify due vaccines (nextDueDate <= today + 7 days)
   - Skip if no due vaccines or vaccine muted
3. Create reminder documents for each due vaccine
4. Fetch user's reminder preferences
5. If SMS enabled: Send SMS via Twilio helper (currently logs message)
6. If push enabled: Queue Firebase Cloud Messaging dispatch (future)
7. Create booking suggestions for overdue vaccines (nextDueDate < today)
8. Log audit event for each pet checked
9. Return summary (petsChecked, remindersCreated, smsSent, failures)

**Response:**
```json
{
  "petsChecked": 150,
  "remindersCreated": 47,
  "smsSent": 45,
  "failures": ["Pet pet_x123: SMS failed"],
  "duration": 2341  // milliseconds
}
```

**Error Handling:**
- Failed SMS not retried in same cycle (skipped, logged)
- Per-pet errors caught; cron continues with other pets
- Summary includes failure list for ops review

---

## Security

### Authorization

**Pet Profile Access:**
- POST /health/pets: Authenticated user only; ownerId auto-set
- GET /health/pets/:petId: Verified via `pet.ownerId === user.uid`
- PATCH /health/pets/:petId: Verified via pet ownership
- All checks at route layer + service layer

**Reminder & Booking Access:**
- GET /health/reminders: Authenticated; filters by user's pet ownership
- PATCH /health/reminders/preferences: Authenticated; updates own ownerId
- POST /health/reminders/:reminderId/dismiss: Ownership verified via pet chain
- GET /health/booking-suggestions: Verified via pet ownership
- POST /health/booking-suggestions/:suggestionId/accept: Verified via pet ownership

**Authorization Pattern:**
```
1. User token → ownerId claim
2. Fetch resource (pet, reminder, suggestion)
3. Fetch resource.petId → pet.ownerId
4. Compare pet.ownerId === user.ownerId
5. Return 404 if mismatch (never reveal 403)
```

### Data Privacy

**Phone Numbers:**
- Stored in `pets.emergencyContact.phone`
- Firestore native encryption at rest
- Never logged in audit trail (before/after redacted)
- SMS dispatch only if user explicitly enabled + phone valid

**No Password Storage:**
- Phone OTP-only authentication
- Tokens stored in AsyncStorage (encrypted by OS)
- No session tokens in code

**Audit Trail:**
- All mutations recorded with timestamp, actor, state change
- Immutable collection (no deletes; status updates only)
- Supports compliance audits and debugging

### Firestore Security Rules

```javascript
// pets collection: owner isolation
allow read, write: if resource.data.ownerId == request.auth.uid

// vaccination_schedules: via pet ownership
allow read: if get(/databases/$(database)/documents/pets/$(pet_id)).data.ownerId == request.auth.uid

// reminders, reminderPreferences, bookingSuggestions: via pet chain
allow read, write: if get(/databases/$(database)/documents/pets/$(resource.data.petId)).data.ownerId == request.auth.uid
```

---

## Mobile Features

### Offline Support

**AsyncStorage Caching:**
- Pet profiles cached after fetch (`pet_${petId}`)
- Vaccination schedules cached after fetch (`schedule_${petId}`)
- Reminder preferences not cached (real-time preference changes)

**Cache Invalidation:**
- `updatePetProfile()`: Removes `pet_${petId}` from cache
- `markVaccineComplete()`: Removes `schedule_${petId}` from cache
- Next screen navigation triggers refresh via API + cache

**Error Handling:**
- AsyncStorage failures silently caught (app continues without cache)
- Offline: Users read cached data; mutations queued (future)

### Reminders

**SMS:**
- Sent via Twilio SDK from cron job
- Message format: `"${petName}'s ${vaccineName} is due on ${dueDate}"`
- Dispatched only if `smsEnabled && emergencyContact.phone`
- Failures logged; not retried in same cycle

**Push Notifications:**
- Firebase Cloud Messaging dispatch from cron (queued for implementation)
- Local notification fallback not yet implemented

**Muting:**
- User can mute individual vaccines in ReminderPreferencesScreen
- Cron job checks `reminderPreferences.mutedVaccines` array
- Muted vaccines skipped silently (no reminder/suggestion created)

### Real-Time Sync

**Firestore Listeners:**
- VaccinationDashboardScreen attaches real-time listener
- Updates vaccine status in real-time (requires Firestore Rules auth)
- Not yet implemented; current implementation uses polling via API

---

## Testing

### Unit Tests

**Vaccine Calculator** (`backend/tests/vaccine-calculator.test.ts`)
- Breed-specific defaults loaded correctly
- Age-based schedule generated from birthdate
- Status determination (completed, upcoming, due_soon, overdue)
- Edge cases: newborn puppies, senior dogs, missing breed

**Health Service** (`backend/tests/health.test.ts`)
- Pet CRUD operations
- Vaccination schedule recalculation on breed/birthdate change
- Audit event logging
- Ownership isolation

**Reminders Service** (`backend/tests/reminders.test.ts`)
- Preference defaults applied
- SMS/push toggles respected
- Reminder creation with channels
- Dismissal updates status

**Booking Suggestions** (`backend/tests/booking-suggestions.test.ts`)
- Suggestion creation for overdue vaccines
- Acceptance updates status + timestamp
- Ownership verification

### Integration Tests (Firebase Emulator)

**Pet Profile → Schedule Recalculation:**
1. Create pet → verify schedule doc created
2. Update breed → verify schedule recalculated

**Mark Vaccine Complete:**
1. Fetch schedule
2. Mark vaccine complete
3. Verify vaccine.status updated
4. Verify health record created
5. Verify related reminders cancelled

**Reminder Preferences:**
1. Update preferences
2. Verify saved to `reminderPreferences/{userId}`
3. Fetch preferences → verify updated

**Offline Cache:**
1. Fetch pet profile → verify cached
2. Simulate offline
3. Read from cache → verify data served
4. Reconnect → verify fresh fetch on next load

### E2E Tests

**Mobile Flow (TBD):**
1. Add new pet → view vaccination dashboard
2. Mark vaccine complete → verify health record appears
3. Update reminder preferences → verify persisted
4. Receive SMS/push notification (simulator)

**Cron Job:**
1. Setup test data: 3 pets, 1 with overdue vaccine
2. Mock Twilio SMS
3. Trigger cron → verify reminders created + SMS sent + booking suggestion created
4. Verify audit logs for all actions

---

## Firestore Indexes

Required indexes for optimal query performance:

| Collection | Fields | Type |
|------------|--------|------|
| `pets` | `ownerId, createdAt` | Composite |
| `vaccination_schedules` | `petId, updatedAt` | Composite |
| `reminders` | `petId, dueDate` | Composite |
| `reminders` | `status, createdAt` | Composite |
| `bookingSuggestions` | `petId, createdAt` | Composite |
| `bookingSuggestions` | `status, createdAt` | Composite |
| `auditLogs` | `petId, timestamp` | Composite |

Firestore will auto-create indexes on first multi-field query; manually create in Firebase Console if needed for pre-production.

---

## Deployment

### Backend Deployment

**Cloud Functions Setup:**
```bash
# Deploy health routes + cron job
firebase deploy --only functions:healthRouter,functions:checkVaccinations

# Verify deployment
gcloud functions describe checkVaccinations --region=us-central1 --gen2

# Check logs
gcloud functions logs read checkVaccinations --limit 50
```

**Cloud Scheduler Setup:**
```bash
# Create daily trigger at 1 AM UTC
gcloud scheduler jobs create pubsub check-vaccinations-daily \
  --schedule="0 1 * * *" \
  --location=us-central1 \
  --topic=check-vaccinations \
  --message-body='{"trigger":"scheduled"}'

# Verify job
gcloud scheduler jobs describe check-vaccinations-daily --location=us-central1
```

**Environment Variables:**
- `TWILIO_ACCOUNT_SID` — Twilio account identifier
- `TWILIO_AUTH_TOKEN` — Twilio authentication token
- `FIREBASE_ADMIN_SDK_KEY` — Service account JSON (Firebase Console)

### Mobile Deployment

**AsyncStorage Setup:**
- Automatically initialized in App.tsx
- No additional config needed

**Firebase Initialization:**
- Config loaded from `.env.local` (not committed)
- Cloud Messaging initialized for push notifications

**EAS Build:**
```bash
eas build --platform ios
eas build --platform android
```

### Firestore Security Rules Deployment

```bash
# Validate rules
firebase rules:test

# Deploy rules
firebase deploy --only firestore:rules
```

---

## Troubleshooting

### Reminders Not Sending

**Symptom:** User doesn't receive SMS/push for due vaccines

**Diagnosis:**
1. Check cron job logs:
   ```bash
   gcloud functions logs read checkVaccinations --limit 20
   ```
2. Verify reminder preferences:
   ```bash
   # Firestore console: reminderPreferences/{userId}
   # Check: smsEnabled=true, phone valid
   ```
3. Verify pet has emergencyContact.phone
4. Check Twilio credentials in Cloud Functions config

**Solution:**
- Enable SMS in ReminderPreferencesScreen
- Update pet's emergencyContact with valid phone
- Re-run cron or wait for next daily trigger

### Vaccination Schedule Not Recalculating

**Symptom:** After updating breed/birthdate, schedule unchanged

**Diagnosis:**
1. Verify breed/birthdate actually changed in pet profile
2. Check health service logs for recalculateSchedule call
3. Verify vaccine-calculator breed defaults include new breed

**Solution:**
- Add breed to `VACCINE_DEFAULTS` in vaccine-calculator.ts
- Manually trigger schedule recalc via API:
  ```bash
  POST /health/pets/{petId}
  { "breed": "new_breed" }
  ```

### Offline Cache Not Syncing

**Symptom:** Changes made offline not reflected after reconnect

**Diagnosis:**
1. Check AsyncStorage permissions (iOS sandbox, Android)
2. Verify AsyncStorage.getItem() succeeds in logs
3. Check network connectivity detection

**Solution:**
- Clear AsyncStorage: Navigate away and back to force refresh
- iOS: Verify app has Documents access
- Android: Check android/app/src/main/AndroidManifest.xml for storage permission

### Booking Suggestion Not Appearing

**Symptom:** Overdue vaccines exist but no suggestion in BookingSuggestionScreen

**Diagnosis:**
1. Verify vaccination schedule has overdue vaccines (nextDueDate < today)
2. Check cron job logs for suggestion creation
3. Verify query filters by petId correctly

**Solution:**
- Manually trigger cron job via API
- Refresh BookingSuggestionScreen via pull-to-refresh
- Check auditLogs for creation_booking_suggestion action

---

## Future Enhancements

### High Priority

1. **Photo Upload for Pets**
   - Currently skipped (YAGNI); add when pet profiles need visual identification
   - Use Firebase Storage + signed URLs
   - Resize on upload to reduce bandwidth

2. **Twilio SMS Integration**
   - Currently stubbed (logs SMS, doesn't dispatch)
   - Implement: Send SMS via Twilio SDK in cron job
   - Error handling: Mark reminder as retry_pending, retry on next cycle
   - Cost: ~$0.01 per SMS

3. **Push Notifications (FCM)**
   - Currently queued for implementation
   - Implement: Firebase Cloud Messaging from cron job
   - Message format: `"${petName}'s ${vaccineName} is due on ${dueDate}"`
   - Requires token collection on mobile (done in App.tsx)

### Medium Priority

4. **Vet Relationship Tracking**
   - Schema exists (`pets.vetRelationships`)
   - Add VetRelationshipScreen to manage favorite vets
   - Link booking suggestions to preferred vet

5. **Insurance Provider Integration**
   - Schema exists (`pets.insuranceId`)
   - Add insurance provider links in pet profile
   - Future: Auto-submit claims from health records

6. **Local Notification Fallback**
   - React Native local notifications if SMS/push fail
   - Only works while app running
   - Lower priority: Backend SMS/push handles uninstalled apps

7. **Real-Time Firestore Listeners**
   - Currently polling via API
   - Add listeners for vaccination schedule + reminders
   - Reduces latency, improves responsiveness

### Low Priority

8. **Health Records Linking to Bookings**
   - Schema exists; join on booking → health record
   - Add `linkedBookingId` field to health records
   - Display booking details in HealthDetailScreen

9. **Vet Booking Pre-Population**
   - BookingSuggestionScreen → BookingScreen flow
   - Pre-fill pet, vaccines, suggested date
   - User selects vet + time, confirms booking

10. **Vaccine History Export**
    - PDF download of vaccination record
    - International travel requirements
    - Vet clinic requests

---

## References

- **Design Spec:** [`docs/superpowers/specs/2026-07-24-phase-3-health-passport-design.md`](superpowers/specs/2026-07-24-phase-3-health-passport-design.md)
- **Implementation Plan:** [`docs/superpowers/plans/2026-07-24-phase-3-health-passport.md`](superpowers/plans/2026-07-24-phase-3-health-passport.md)
- **Backend Source:** `backend/src/services/`, `backend/src/routes/health.ts`
- **Mobile Source:** `src/services/health.ts`, `src/screens/health/`
- **Tests:** `backend/tests/vaccine-calculator.test.ts`, `backend/tests/health.test.ts`, `backend/tests/reminders.test.ts`

---

**Last Updated:** 2026-07-24  
**Phase Status:** 18/18 tasks complete  
**Documentation Phase:** Ready for ops + support team
