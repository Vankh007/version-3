# Khmerzoon-Tv Native App Setup Guide

## App Configuration
- **App Name:** Khmerzoon-Tv
- **Package Name:** com.plexkhmerzoon
- **Server URL:** https://khmerzoon.biz

## Prerequisites
- Node.js 18+
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

## Setup Steps

### 1. Export and Clone Project
1. Click "Export to Github" in Lovable
2. Clone the repository to your local machine
3. Run `npm install`

### 2. Add Native Platforms
```bash
# Add Android
npx cap add android

# Add iOS (Mac only)
npx cap add ios
```

### 3. Build and Sync
```bash
npm run build
npx cap sync
```

### 4. Configure Android Deep Links

Add the following to `android/app/src/main/AndroidManifest.xml` inside the `<activity>` tag:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.plexkhmerzoon" />
</intent-filter>
```

### 5. Configure Supabase OAuth

1. Go to your Supabase Dashboard
2. Navigate to **Authentication → URL Configuration**
3. Add to **Redirect URLs:** `com.plexkhmerzoon://auth/callback`
4. Save changes

### 6. Configure AdMob (Production)

1. Create an AdMob account at https://admob.google.com
2. Create apps for Android and iOS
3. Get your App IDs and Ad Unit IDs
4. Update the following files with your production IDs:

**src/hooks/useAdMob.tsx:**
```typescript
const AD_CONFIG = {
  android: {
    appId: 'ca-app-pub-YOUR_ANDROID_APP_ID',
    banner: 'ca-app-pub-YOUR_BANNER_ID',
    interstitial: 'ca-app-pub-YOUR_INTERSTITIAL_ID',
    rewarded: 'ca-app-pub-YOUR_REWARDED_ID',
  },
  ios: {
    // Same for iOS
  }
};
```

**For Android:** Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-YOUR_APP_ID"/>
```

**For iOS:** Add to `ios/App/App/Info.plist`:
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-YOUR_APP_ID</string>
```

### 7. Run the App

```bash
# Android
npx cap run android

# iOS
npx cap run ios
```

## Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - `com.plexkhmerzoon://auth/callback`
4. Enable Google Sign-In in Supabase Dashboard under **Authentication → Providers**

## Updating the App

After making changes in Lovable:
1. `git pull`
2. `npm install`
3. `npm run build`
4. `npx cap sync`
5. Run the app

## Troubleshooting

### OAuth not redirecting back to app
- Ensure the deep link scheme is correctly configured in AndroidManifest.xml
- Verify the redirect URL is added in Supabase Dashboard
- Check that the URL scheme matches exactly: `com.plexkhmerzoon`

### AdMob ads not showing
- Ensure you're testing on a real device (emulators may have issues)
- Verify your AdMob account is approved
- Check that the Ad Unit IDs are correct for the platform
