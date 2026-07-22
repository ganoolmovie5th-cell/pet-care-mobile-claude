# CLAUDE.md

Panduan untuk Claude dan asisten berbasis Claude yang mengerjakan repository ini.

Baca [`AGENTS.md`](AGENTS.md) terlebih dahulu untuk konteks subagent-driven execution.

## Ringkas Cepat

- **Proyek:** Pet Care Community MVP — marketplace pet care Indonesia (mobile app)
- **Stack:** React Native 0.73+, Expo 50+, TypeScript, Firebase, Xendit
- **Timeline:** 5-6 minggu solo development
- **Target:** 10K owner, freemium Rp100K/mo subscription, 5% conversion
- **Platform:** iOS + Android dari single codebase

## Struktur Repo

```
src/
  ├── navigation/    Bottom tabs + nested stacks per feature
  ├── screens/       Feature screens organized by feature
  ├── services/      Firebase, backend API, offline sync
  ├── components/    Reusable UI components
  ├── hooks/         State logic (useAuth, useVet, etc)
  ├── context/       Global state (AuthContext, AppContext)
  ├── types/         TypeScript interfaces
  ├── utils/         Validation, date helpers, geo, constants
  ├── styles/        Theme, global styles
  └── __tests__/     Jest + Firebase Emulator tests

app.json              Expo configuration
```

## Konvensi

### Code Style
- **TypeScript** — strict mode
- **Prettier** — auto-format
- **ESLint** — enforce rules
- **Jest** — test framework (TDD)
- **No comments** — self-documenting code; only WHY

### Naming
- **Files:** kebab-case (`phone-screen.tsx`, `booking-service.ts`)
- **Functions/Variables:** camelCase
- **Types/Interfaces:** PascalCase
- **Constants:** UPPER_SNAKE_CASE

### Commits
- **Frequent:** Per task step
- **Format:** `feat: add OTP screen`, `fix: offline sync`, `test: auth flow`
- **Co-author:** All commits include Claude co-authorship

### Testing
- **Unit tests:** Services, hooks, utils (80%+ coverage)
- **Integration tests:** Firebase Emulator for auth/data
- **No mocks** — hit real Firebase
- **File location:** `__tests__/` mirroring `src/`

## Before Starting Work

1. Read design spec: `../pet-care-claude/docs/superpowers/specs/2026-07-22-pet-care-community-design.md`
2. Read implementation plan: `../pet-care-claude/docs/superpowers/plans/2026-07-22-pet-care-community-implementation.md`
3. Understand task dependencies
4. Check existing patterns in screens/, services/, hooks/

## During Development

### Screens (src/screens/*)
- **Auth screens:** Phone entry, OTP, profile setup
- **Feature screens:** One per major flow (VetBrowseScreen, BookingScreen, AddRecordScreen, etc)
- Full-page components, handle navigation logic

### Services (src/services/*)
- **firebase.ts** — Firebase init with AsyncStorage persistence
- **auth.ts** — sendPhoneOTP(), verifyOTP(), logout()
- **vet.ts** — Browse, search, get details
- **booking.ts** — Create, list, cancel bookings
- **health.ts** — Add pet, records, reminders
- **playdate.ts** — Posts, chat, matches
- **payment.ts** — Xendit widget integration
- **notifications.ts** — FCM + Twilio SMS listeners
- **offline.ts** — Local queue, sync on reconnect
- **api.ts** — Axios instance (auto-includes auth header)

### Hooks (src/hooks/*)
- **useAuth** — Current user, loading, error, logout
- **useVet** — Browse, filter, get details
- **useHealth** — Add pet, records, reminders
- **usePlaydate** — Posts, chat, matches
- **useBooking** — Create, list, cancel
- **useOffline** — Sync queue, reconnect
- **useNotifications** — FCM + SMS listeners

### Context (src/context/*)
- **AuthContext** — User state, loading, error, onAuthStateChanged
- **AppContext** — Subscription status, notifications enabled

### Components (src/components/*)
- **Reusable UI blocks** — VetCard, BookingForm, RecordCard, PostCard, ChatBubble, Button, Card, Modal, Loading, Header
- One component per file, prop-driven

### Local Development

```bash
# Terminal 1: Expo dev server
npm run web              # Web preview, auto-reload

# Terminal 2: Tests
npm test -- --watch     # Jest watch mode

# Terminal 3: Backend (in pet-care-claude/backend)
cd ../pet-care-claude/backend && npm run dev
```

Then use Expo Go app to scan QR code from Terminal 1 and run on device.

### Before Committing

```bash
npm run lint            # ESLint
npm run format          # Prettier
npm test                # Jest
npm run build           # Verify build succeeds
```

## Firebase & Offline-First

### Authentication
Phone OTP → Firebase ID token → Backend JWT (see backend CLAUDE.md for flow)

### Persistence
AsyncStorage (React Native) for:
- Offline tokens (encrypted by OS)
- Cached app state (sync queue, user preferences)

### Offline Sync
1. Service detects network loss
2. Enqueue mutations in Realtime DB
3. On reconnect, play back queue
4. Resolve conflicts (last-write-wins)
5. Mark synced in local cache

## Data Model (Read design spec for full schema)

```
users/{userId}
  phone, name, email, subscription_status

vets/{vetId}
  clinic_name, location, specialties, rating

pets/{petId}
  ownerId, name, breed, age, photo

bookings/{bookingId}
  ownerId, petId, vetId, date, time, status, payment_status

health_records/{recordId}
  petId, type, date, note, next_due_date

playdate_posts/{postId}
  ownerId, petId, location, date, description

reminders/{reminderId}
  petId, type, due_date, status
```

## Security

- No password storage (phone OTP only)
- JWT in localStorage + AsyncStorage
- Firestore rules (owner isolation)
- No secrets in code or .env (use .env.example)

## Performance

- Use `React.memo()` for expensive screens
- Lazy-load navigation screens
- Implement offline caching
- Optimize images before storage
- Profile with React Native Debugger

## Phase Gates

**Phase 1 (Tasks 1-4): Auth & Core**
- Phone OTP working end-to-end
- Gate: Phone → OTP → Dashboard

**Phase 2 (Tasks 5-20): Vet Marketplace**
- Browse vets, book, pay
- Gate: Vet browse → booking → payment confirmation

**Phase 3 (Tasks 21-35): Health Passport**
- Pet profiles, health records, reminders
- Gate: Add pet → record → reminder SMS/push

**Phase 4 (Tasks 36-50): Playdate Community**
- Posts, chat, matching
- Gate: Post pet → interested matches → chat

**Phase 5 (Tasks 51-60): Polish**
- Offline sync, error handling, performance
- Gate: All 4 features stable, 50+ beta testers

## When Stuck

1. Check Firebase Emulator logs: `firebase emulators:start`
2. Check Expo logs: `npm run web` shows console output
3. Check device via `adb logcat` (Android) or Xcode (iOS)
4. Run `npm test` to isolate issue
5. Grep for similar patterns: `grep -r "pattern" src/`

## Next Steps

Start with Subagent-Driven execution: dispatch fresh subagent per task from implementation plan, review checkpoints.

See `AGENTS.md` for execution model.
