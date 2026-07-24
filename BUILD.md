# Mobile Build & Submission Guide

## Prerequisites

1. **EAS Account**: `npm install -g eas-cli && eas login`
2. **Apple Developer Account**: Enrolled, with team ID
3. **Google Play Account**: Developer account with access
4. **Credentials**:
   - Apple: App ID, Team ID, Apple ID password
   - Google: Service account JSON key (`keys/google-play-key.json`)

## Internal Testing (Preview)

```bash
# iOS
eas build --platform ios --profile preview

# Android
eas build --platform android --profile preview

# Both
eas build --platform all --profile preview
```

Builds sent to:
- iOS: TestFlight (internal testers)
- Android: Google Play internal testing track

## Production Build

### iOS (TestFlight → App Store)
```bash
eas build --platform ios --profile production --auto-submit
```

Submission config in `eas.json`:
- `appleTeamId`: Team ID from Apple Developer
- `appleId`: Apple ID email
- `ascAppId`: App Store Connect app ID
- `sku`: Bundle ID (com.petcare.mobile)

### Android (Google Play)
```bash
eas build --platform android --profile production --auto-submit
```

Submission config:
- `serviceAccount`: Path to Google Play service key
- `track`: "production" (auto-promotes after review)

## Local Build (Development)

```bash
# Web preview
npm run web

# Android emulator
eas build --platform android --local

# iOS simulator
eas build --platform ios --local
```

## Troubleshooting

**Build fails on EAS**:
- Check logs: `eas builds` → select build → view full log
- Verify credentials in `eas.json`
- Ensure `app.json` version incremented

**TestFlight upload rejected**:
- Check app.json bundleIdentifier matches Apple
- Verify provisioning profiles active
- Review App Store Connect for messages

**Google Play rejection**:
- Privacy policy required
- Target API level ≥ 34
- Check content rating questionnaire

## Version Management

Update in `app.json`:
```json
{
  "expo": {
    "version": "1.0.0"
  }
}
```

EAS auto-increments Android versionCode.
