# Pet Care Mobile

Aplikasi mobile Pet Care Community untuk pemilik hewan peliharaan Indonesia. Browse dokter hewan, booking, kelola kesehatan pet, dan cari teman bermain.

**Tech Stack:** React Native · Expo · TypeScript · React Navigation · Firebase · Xendit

**Web Dashboard & Backend:** [pet-care-claude](https://github.com/ganoolmovie5th-cell/pet-care-claude)

## Features

- Vet Marketplace (browse, book, rate vets/clinics)
- Health Passport (pet health records + vaccination reminders)
- Playdate Community (meetup matching + in-app chat)
- Insurance Aggregator (comparison links)
- Phone OTP auth (Firebase, +62 validation)
- Payment (Xendit widget)
- Push notifications (FCM) + SMS reminders (Twilio)
- Offline sync (queue + reconnect)
- Home feed (aggregator: bookings, reminders, playdate posts)

## Getting Started

```bash
npm install
cp .env.example .env
npm start
```

Scan QR code dengan Expo Go.

## Project Structure

```
src/
  navigation/       → RootNavigator, VetStack, HealthStack, PlaydateStack, AuthStack
  screens/
    auth/               PhoneScreen, OTPScreen, ProfileSetupScreen
    vet/                VetBrowse, VetDetail, Booking, Rating
    health/             PetProfile, HealthDetail, AddRecord, Reminders
    playdate/           Feed, Post, Detail, Chat, PhotoShare
    profile/            Profile, Subscription, Settings, BookingHistory
    home/               HomeScreen (feed aggregator)
  services/         → firebase, auth, vet, booking, health, playdate, payment, offline, api
  components/       → vet/, health/, playdate/, profile/, common/
  hooks/            → useAuth, useVet, useHealth, usePlaydate, useBooking, useOffline
  context/          → AuthContext, AppContext
  types/            → TypeScript interfaces
  utils/            → validation, dateHelpers, geoHelpers, constants
  styles/           → theme, globalStyles
```

## Testing

```bash
npm test
npm run lint
npx tsc --noEmit
```

## License

MIT
