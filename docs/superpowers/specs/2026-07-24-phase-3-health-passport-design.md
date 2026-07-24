# Phase 3 — Health Passport Design Spec

**Goal:** Add comprehensive pet profiles, vaccination tracking, health records linked to bookings, and smart reminder system (SMS + push) with vet booking suggestions.

**Architecture:** Hybrid backend-mobile. Backend calculates vaccination schedules daily, dispatches SMS/push, suggests bookings. Mobile syncs via Firestore listeners, caches offline, uses local reminder fallback.

**Tech Stack:** React Native (mobile), Express Cloud Functions (backend), Firestore, Twilio (SMS), Firebase Cloud Messaging (push).

---

## Global Constraints

- Vaccination schedule calculation must complete daily at 1 AM UTC
- SMS/push delivery required for due/overdue vaccines; backend retry on dispatch failure
- Offline pet profile + schedule readable in AsyncStorage without internet
- All health data changes audit-logged (timestamp, actor, change type)
- Pet profiles tied to owner (ownerId isolation via Firestore rules)
- Vaccine names must match breed-specific defaults (configurable per breed)
- Reminder timing 1–30 days before due date

---

## Data Model

### Firestore Schema

```
pets/{petId}
  ├─ ownerId (string, required)
  ├─ name (string)
  ├─ breed (string)
  ├─ birthdate (date, ISO string)
  ├─ age (number, computed from birthdate)
  ├─ photo (string, URL)
  ├─ microchip (string, optional)
  ├─ weight (number, kg, optional)
  ├─ color (string, optional)
  ├─ bloodType (enum: 'A' | 'B' | 'AB' | 'O', optional)
  ├─ allergies (string[], optional)
  ├─ insuranceId (string, optional)
  ├─ emergencyContact (object)
  │  ├─ name (string)
  │  └─ phone (string)
  ├─ vetRelationships (array of {vetId, clinicName, lastVisit})
  └─ createdAt (timestamp)

vaccinationSchedules/{scheduleId}
  ├─ petId (string, required)
  ├─ petName (string)
  ├─ breed (string)
  ├─ vaccines (array)
  │  ├─ [i].id (string, vaccine type ID)
  │  ├─ [i].name (string, e.g., "Rabies", "DHPP")
  │  ├─ [i].lastDate (date, ISO, nullable)
  │  ├─ [i].nextDueDate (date, ISO)
  │  ├─ [i].status (enum: 'completed' | 'upcoming' | 'due_soon' | 'overdue')
  │  └─ [i].frequency (string, e.g., "annual", "3-year", "booster")
  ├─ calculatedAt (timestamp)
  └─ updatedAt (timestamp)

reminders/{reminderId}
  ├─ petId (string)
  ├─ vaccineId (string)
  ├─ dueDate (date, ISO)
  ├─ status (enum: 'pending' | 'sent' | 'dismissed' | 'cancelled')
  ├─ reminderChannels (array: 'sms' | 'push')
  ├─ sentAt (timestamp, nullable)
  ├─ readAt (timestamp, nullable)
  └─ createdAt (timestamp)

reminderPreferences/{userId}
  ├─ ownerId (string)
  ├─ smsEnabled (boolean)
  ├─ pushEnabled (boolean)
  ├─ reminderDaysBefore (number, 1–30)
  ├─ mutedVaccines (string[], vaccine IDs)
  └─ updatedAt (timestamp)

bookingSuggestions/{suggestionId}
  ├─ petId (string)
  ├─ overdueVaccines (string[], vaccine IDs)
  ├─ suggestedDate (date, ISO)
  ├─ vetId (string, optional, recommended vet)
  ├─ status (enum: 'pending' | 'accepted' | 'dismissed')
  ├─ createdAt (timestamp)
  └─ acceptedAt (timestamp, nullable)

auditLogs/{logId}
  ├─ petId (string)
  ├─ actor (string, user/system)
  ├─ action (string, e.g., "vaccine_completed", "schedule_recalculated", "reminder_sent")
  ├─ before (object, previous state)
  ├─ after (object, new state)
  └─ timestamp (timestamp)
```

---

## Mobile Screens

### 1. Pet Profile Screen
**File:** `src/screens/health/PetProfileScreen.tsx`

Displays pet card with extended info. Shows name, photo, breed, age, weight, blood type, allergies, microchip. Buttons: Edit Profile, Vaccinations, Health Records, Emergency Contacts.

**Navigation:**
- Edit Profile → EditPetProfileScreen
- Vaccinations → VaccinationDashboardScreen
- Health Records → HealthDetailScreen [existing, extend to show linkedBookingId]
- Emergency Contacts → read-only view

### 2. Vaccination Dashboard Screen
**File:** `src/screens/health/VaccinationDashboardScreen.tsx`

Overview of all vaccines for selected pet. Tabs or sections: Up-to-Date, Due Soon (7–30 days), Overdue, Completed.

Each vaccine card shows: name, last date, next due date, status badge, "Schedule Vet" button. Real-time sync via Firestore listener.

**Navigation:**
- Schedule Vet → BookingSuggestionScreen

### 3. Edit Pet Profile Screen
**File:** `src/screens/health/EditPetProfileScreen.tsx`

Form to update pet metadata: name, breed, age, birthdate, weight, color, blood type, allergies, microchip, insurance ID, emergency contact (name + phone).

On save, updates Firestore pets/{petId} and triggers vaccination schedule recalculation if breed/birthdate changed.

### 4. Reminder Preferences Screen
**File:** `src/screens/health/ReminderPreferencesScreen.tsx`

User toggles SMS/push channels, sets reminder timing (days before due), mutes individual vaccines, saves to Firestore reminderPreferences/{userId}.

### 5. Booking Suggestion Screen
**File:** `src/screens/health/BookingSuggestionScreen.tsx`

Lists overdue vaccines, allows user to pick vet and date, then navigates to BookingScreen with pre-filled pet + vaccines context.

---

## Backend Endpoints

### Pet Profile (Extend Existing)

**POST /health/pets**
```json
Request: {
  "name": "Bella",
  "breed": "Golden Retriever",
  "birthdate": "2022-01-15",
  "weight": 25,
  "color": "cream",
  "bloodType": "A",
  "allergies": ["chicken"],
  "microchip": "ABC123",
  "insuranceId": "INS456",
  "emergencyContact": { "name": "Mom", "phone": "+62812345678" }
}
Response: { "id": "pet_123", "createdAt": "2026-07-24T10:00:00Z" }
```
Auth: Firebase token with ownerId claim.

**GET /health/pets/:petId**
Returns full pet profile with all extended fields.

**PATCH /health/pets/:petId**
Update any subset of fields. If breed or birthdate changed, trigger recalculation.

### Vaccination Schedules

**GET /health/pets/:petId/vaccination-schedule**
Fetch calculated schedule for pet. Returns vaccinationSchedules doc or 404 if not yet calculated.

**POST /health/pets/:petId/vaccination-schedule/recalculate**
Force schedule recalculation (e.g., breed changed). Returns updated schedule.

**PATCH /health/vaccination-schedules/:scheduleId/vaccines/:vaccineId**
Mark vaccine complete. Request:
```json
{
  "lastDate": "2026-07-24",
  "vetName": "Dr. Smith",
  "notes": "No side effects"
}
```
Updates schedule, cancels related pending reminders, creates health record.

### Reminders & Preferences

**GET /health/reminders/preferences**
Fetch user's reminder settings (sms, push, timing, muted list).

**PATCH /health/reminders/preferences**
Update settings:
```json
{
  "smsEnabled": true,
  "pushEnabled": true,
  "reminderDaysBefore": 7,
  "mutedVaccines": ["vaccine_id_1"]
}
```

**GET /health/reminders**
List all reminders for user's pets (filtering by status, due date).

### Booking Suggestions

**GET /health/pets/:petId/booking-suggestions**
List pending/accepted suggestions with overdue vaccine info.

**POST /health/pets/:petId/booking-suggestions/:suggestionId/create-booking**
Auto-populate booking form from suggestion, navigate to BookingScreen.

### Scheduled Cron Job

**POST /health/cron/check-vaccinations**
(Triggered daily at 1 AM UTC via Cloud Scheduler)

Algorithm:
1. Iterate all pets in Firestore
2. For each pet's vaccination schedule:
   - Check vaccines against today's date
   - Identify due (today to +7 days), due_soon, overdue (past today)
   - Create reminder docs for new due/overdue vaccines
   - Fetch user's reminder preferences (sms/push/muted)
   - Send Twilio SMS + Firebase Cloud Messaging push for enabled channels
   - Skip muted vaccines
3. Create booking suggestions for overdue vaccines
4. Log all actions to auditLogs collection
5. Return summary (pets checked, reminders sent, failures)

Error handling: If SMS/push dispatch fails, mark reminder as retry_pending and retry on next cycle.

---

## Mobile Services & Hooks

### Service: `src/services/health.ts` (Extend Existing)

New functions:
- `getPetProfile(petId): Promise<Pet>` — read full profile
- `updatePetProfile(petId, updates): Promise<void>` — update fields
- `getVaccinationSchedule(petId): Promise<VaccinationSchedule>` — fetch schedule
- `markVaccineComplete(scheduleId, vaccineId, date, vetName, notes): Promise<void>` — complete vaccine
- `getReminderPreferences(): Promise<ReminderPreferences>` — fetch user settings
- `updateReminderPreferences(prefs): Promise<void>` — save settings
- `getReminders(): Promise<Reminder[]>` — list all reminders
- `dismissReminder(reminderId): Promise<void>` — user dismisses
- `getBookingSuggestions(petId): Promise<BookingSuggestion[]>` — list suggestions

### Hook: `src/hooks/useHealth.ts` (Extend Existing)

New hooks or extend existing:
- `useVaccinationSchedule(petId)` — returns { schedule, loading, error, refetch }
- `useReminderPreferences()` — returns { prefs, loading, updatePrefs, error }
- `useBookingSuggestions(petId)` — returns { suggestions, loading, acceptSuggestion }

---

## Offline & Sync

**AsyncStorage Caching:**
- Cache pet profile + schedule after fetch
- Cache reminder preferences
- Sync via Firestore listener on reconnect

**Queue Updates:**
- When offline, queue reminder preference changes
- On reconnect, replay queue via Firestore batch writes

**Fallback Reminders:**
- Local notifications (React Native) scheduled from cached schedule if backend SMS/push fails
- Only if app is running; backend SMS/push handles uninstalled apps

---

## Testing

### Unit Tests
- Vaccination schedule calculation (age + breed logic) — edge cases: young puppies, senior dogs, breed-specific schedules
- Reminder preference validation — timing 1–30, channels, muted list
- Audit log formatting

### Integration Tests (Firebase Emulator)
- Pet profile CRUD → vaccinationSchedules trigger
- Mark vaccine complete → create health record + cancel reminders
- Reminder preference save → queued offline, synced on reconnect
- Firestore listener sync (offline cache)

### E2E Tests
- Add new pet → view vaccination schedule → mark vaccine complete → view in health records
- Trigger cron job → reminders sent → user sees notification

### Cron Job Tests
- Mock Firestore pets, run check-vaccinations, verify reminders created + SMS/push queued + audit logged

---

## Success Criteria

✓ Pet profiles show extended metadata (weight, blood type, allergies, insurance, emergency contact)
✓ Vaccination schedule calculated on pet creation and recalc triggered on breed/birthdate change
✓ Daily cron sends SMS + push for due/overdue vaccines per user preference
✓ Booking suggestions created for overdue vaccines; user can create booking from suggestion
✓ Health records linked to bookings (if created from vet visit context)
✓ Reminders synced in real-time; offline cache works
✓ All state changes audit-logged
✓ Tests cover schedule calculation, sync, cron, error handling
