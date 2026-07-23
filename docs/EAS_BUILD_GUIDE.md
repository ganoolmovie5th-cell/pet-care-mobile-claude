# EAS Build & Submit Guide

## Prerequisites
1. Expo CLI: `npm install -g eas-cli`
2. Expo account at https://expo.dev
3. Apple Developer account (iOS)
4. Google Play Developer account (Android)

## Build Setup Checklist

### iOS Setup
- [ ] Register bundle ID `com.petcare.mobile` on Apple Developer
- [ ] Create App on App Store Connect
- [ ] Generate Apple Team ID
- [ ] Create App-Specific Passwords for submission

### Android Setup
- [ ] Create Play Console project
- [ ] Generate keystore (signing key)
- [ ] Store Google Play API service account JSON

## Build Commands

### Preview Build (for testing)
```bash
eas build --platform ios android --profile preview
```

### Production Build (for store submission)
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Monitor Build Status
```bash
eas build:list
eas build:view <build-id>
```

## Submit to Stores

### iOS (after archive build)
```bash
eas submit --platform ios --latest
```

### Android (after APK build)
```bash
eas submit --platform android --latest
```

## Environment Variables
Production build uses `.env.production`:
- REACT_APP_API_BASE_URL=https://us-central1-pet-care-prod.cloudfunctions.net
- Firebase config (public keys)

## Credentials Management
```bash
eas credentials
```
Interactive prompt to store/update iOS/Android credentials.

## Post-Build
1. Wait for build to complete (15-30 min typical)
2. Download IPA (iOS) or APK (Android)
3. Test on device via TestFlight (iOS) or internal track (Android)
4. Submit to review when ready

## Troubleshooting
- `eas build` fails on credentials: run `eas credentials` first
- iOS build timeout: increase timeout in eas.json
- Android build size too large: check node_modules (npm prune)
