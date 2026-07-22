# Pet Care Community — React Native Mobile App

**Status:** MVP Implementation  
**Timeline:** 5-6 weeks solo development  
**Target:** 10K owners (Jakarta/Surabaya), 5% subscription conversion

## Overview

Pet Care Community mobile app connects Indonesian pet owners with vets, groomers, and other pet owners. Built with React Native + Expo for iOS and Android from single codebase.

The **web vet dashboard** and **Node.js backend API** are in a separate repository: [pet-care-claude](https://github.com/ganoolmovie5th-cell/pet-care-claude)

## Features (MVP)

1. **Vet Marketplace** — browse, book, rate vets/clinics
2. **Health Passport** — digital pet health records with vaccination reminders
3. **Playdate Community** — pet owner meetup matching and coordination
4. **Insurance Aggregator** — comparison links to pet insurance partners

## Project Structure

```
src/
├── App.tsx                     # Root navigator, theme provider
├── navigation/
│   ├── RootNavigator.tsx       # Bottom tabs (5 main features)
│   ├── VetStack.tsx            # Vet marketplace nested navigation
│   ├── HealthStack.tsx         # Health passport
│   ├── PlaydateStack.tsx       # Playdate community
│   ├── ProfileStack.tsx        # Owner profile
│   └── AuthStack.tsx           # Auth flow (phone/OTP/profile setup)
├── screens/
│   ├── auth/
│   │   ├── PhoneScreen.tsx     # Phone entry (+62 validation)
│   │   ├── OTPScreen.tsx       # 6-digit OTP verification
│   │   └── ProfileSetupScreen.tsx  # Pet setup after first login
│   ├── vet/
│   │   ├── VetBrowseScreen.tsx    # Map + list view
│   │   ├── VetDetailScreen.tsx    # Vet profile, reviews
│   │   ├── BookingScreen.tsx      # Date/time/pet selection
│   │   ├── BookingConfirmScreen.tsx  # Payment + confirmation
│   │   └── RatingScreen.tsx       # Post-visit rating
│   ├── health/
│   │   ├── PetProfileScreen.tsx   # Pet info + health summary
│   │   ├── HealthDetailScreen.tsx # View single record
│   │   ├── AddRecordScreen.tsx    # Add vaccination/check-up/etc
│   │   └── RemindersScreen.tsx    # Vaccination reminders
│   ├── playdate/
│   │   ├── PlaydateFeedScreen.tsx # Browse posts
│   │   ├── PostPlaydateScreen.tsx # Create post
│   │   ├── PlaydateDetailScreen.tsx  # Post details + interested owners
│   │   ├── PlaydateChatScreen.tsx # Chat with interested owner
│   │   └── PhotoShareScreen.tsx   # Post photos after meetup
│   ├── profile/
│   │   ├── ProfileScreen.tsx   # Owner info, pets list
│   │   ├── SubscriptionScreen.tsx  # Rp100K/mo plans
│   │   ├── SettingsScreen.tsx  # Notifications, language, logout
│   │   └── BookingHistoryScreen.tsx  # Past appointments
│   └── home/
│       └── HomeScreen.tsx      # Feed aggregator (bookings, reminders, playdate posts)
├── services/
│   ├── firebase.ts            # Firebase init, persistence
│   ├── auth.ts                # sendPhoneOTP, verifyOTP, logout
│   ├── vet.ts                 # Browse vets, get details, search
│   ├── booking.ts             # Create booking, get bookings, cancel
│   ├── health.ts              # Add pet, add health record, get reminders
│   ├── playdate.ts            # Create post, get feed, match owners
│   ├── payment.ts             # Xendit payment widget integration
│   ├── notifications.ts       # FCM + Twilio SMS listeners
│   ├── offline.ts             # Offline queue, sync on reconnect
│   └── api.ts                 # Axios instance with auth header
├── components/
│   ├── vet/                   # VetCard, VetSearchBar, BookingForm, etc
│   ├── health/                # RecordCard, RemindersWidget, etc
│   ├── playdate/              # PostCard, ChatBubble, InterestButton, etc
│   ├── profile/               # PetCard, SubscriptionCard, etc
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       └── Header.tsx
├── hooks/
│   ├── useAuth.ts             # Current user, logout
│   ├── useVet.ts              # Search, filter, get details
│   ├── useHealth.ts           # Add pet, records, reminders
│   ├── usePlaydate.ts         # Posts, matches, chat
│   ├── useBooking.ts          # Create, list, cancel bookings
│   ├── useOffline.ts          # Sync queue, reconnect logic
│   └── useNotifications.ts    # FCM + SMS listeners
├── context/
│   ├── AuthContext.tsx        # User, loading, error, signOut
│   └── AppContext.tsx         # Subscription status, notifications enabled
├── types/
│   └── index.ts               # TypeScript interfaces (SportEvent, Booking, Pet, etc)
├── utils/
│   ├── validation.ts          # Phone, email, etc validators
│   ├── dateHelpers.ts         # Format dates, calculate due dates
│   ├── geoHelpers.ts          # Distance calc, geo-queries
│   └── constants.ts           # API endpoints, config values
├── styles/
│   ├── theme.ts               # Colors, fonts, spacing
│   └── globalStyles.ts        # Reset, common styles
└── __tests__/
    ├── auth.test.ts
    ├── vet.test.ts
    ├── health.test.ts
    └── [mirroring src/ structure]

app.json                        # Expo config (icon, splash, plugins)
package.json
tsconfig.json
.env.example
```

## Setup

### Prerequisites

- **Node.js** v20+
- **Expo CLI** (`npm install -g expo-cli`)
- **Firebase Project** (web config)
- **Eas Account** (optional, for managed builds)
- **Physical device** or emulator for testing

### Installation

```bash
npm install

# Configure environment
cp .env.example .env
# Fill in: REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_PROJECT_ID, REACT_APP_API_BASE_URL

# Start dev server
npm run web              # Opens Expo Go web preview
npm run android          # Build for Android
npm run ios              # Build for iOS (macOS only)

# Run tests
npm test
```

## Development Workflow

### Local Testing (Recommended)

```bash
# Terminal 1: Expo dev server
npm run web

# Terminal 2: Tests
npm test -- --watch

# Terminal 3: Backend (in pet-care-claude/backend)
npm run dev
```

Then use Expo Go app (iOS/Android) to scan QR code and run app on device.

### Features by Phase

**Phase 1 (Week 1): Auth & Core**
- Phone OTP login
- Pet profile setup
- Firebase authentication

**Phase 2 (Week 2): Vet Marketplace**
- Browse vets (map + list)
- Booking flow
- Payment via Xendit

**Phase 3 (Week 3): Health Passport**
- Add pet records
- Vaccination tracking
- Reminders (SMS + push)

**Phase 4 (Week 4): Playdate Community**
- Create posts
- Match with other owners
- In-app chat

**Phase 5 (Week 5-6): Polish**
- Insurance links
- Offline sync
- Performance optimization

## Architecture

| Component | Technology | Role |
|-----------|-----------|------|
| **Frontend** | React Native 0.73+, Expo 50+ | Cross-platform UI |
| **Navigation** | React Navigation 6+ | Stack, tab, modal routing |
| **State** | Context API + hooks | Auth, app-level state |
| **Backend** | Node.js/Express (separate repo) | REST API |
| **Database** | Firebase Firestore | Structured data |
| **Realtime** | Firebase Realtime DB | Chat, live updates |
| **Auth** | Firebase Auth | Phone OTP |
| **Push** | Firebase Cloud Messaging | Notifications |
| **SMS** | Twilio | Reminders |
| **Payments** | Xendit | E-wallet, bank transfer |
| **Storage** | Firebase Cloud Storage | Pet photos |

## Testing

- **Unit tests** (Jest): Services, hooks, utils
- **Integration tests** (Firebase Emulator): Database, auth flows
- **E2E tests** (Detox): Full user flows (login → booking → payment)

Run tests:
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm run test:coverage      # Coverage report
```

## Performance Tips

- Use `React.memo()` for expensive re-renders
- Lazy load screens with React Navigation
- Implement offline-first caching (see `services/offline.ts`)
- Optimize images with `@react-native-community/image-editor`
- Profile with React Native Debugger

## Deployment

- **iOS:** Via EAS (Expo Application Services) → Apple App Store
- **Android:** Via EAS → Google Play Store

Deploy commands TBD after MVP launch.

## Security

- Phone OTP auth (6-digit, 10-min expiry)
- JWT sessions (7-day + refresh)
- AsyncStorage for offline tokens (encrypted by OS)
- No password storage
- Firestore security rules (owner isolation)

## Documentation

- **Design Spec:** `../pet-care-claude/docs/superpowers/specs/2026-07-22-pet-care-community-design.md`
- **Implementation Plan:** `../pet-care-claude/docs/superpowers/plans/2026-07-22-pet-care-community-implementation.md`
- **Agent Coordination:** `AGENTS.md` (for Subagent-Driven execution)
- **IDE Configuration:** `CLAUDE.md` (for Claude Code IDE)

## Troubleshooting

**Expo won't start:**
```bash
npm install -g expo-cli
npx expo --version
npm run web  # Retry
```

**Firebase config missing:**
Check `.env` file has all required keys from `.env.example`

**Emulator crashes:**
Clear Expo cache: `npm run web -- --clear`

**Tests failing:**
Check Firebase Emulator running: `firebase emulators:start`

## Support & Feedback

Issues & feedback tracked in GitHub Issues. Daily feedback loop during MVP iteration.

---

**Next Steps:** Set up local dev environment, run `npm run web`, verify Phone/OTP screens render.
