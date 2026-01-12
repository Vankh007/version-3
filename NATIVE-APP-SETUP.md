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

### 6. Configure AdMob from Admin Dashboard

**All AdMob settings are now controlled from your admin dashboard at `/admin/ads` under "Ads for App (AdMob)".**

#### In the Admin Dashboard:
1. Go to `/admin/ads` → "Ads for App (AdMob)" tab
2. Click "AdMob Settings" sub-tab
3. Enter your **Android App ID** (e.g., `ca-app-pub-XXXXXXXX~YYYYYYYY`)
4. Enter your **iOS App ID** (e.g., `ca-app-pub-XXXXXXXX~ZZZZZZZZ`)
5. Toggle "Enable Ads" and "Test Mode" as needed

#### Create Ad Units:
1. Go to "Ad Units" sub-tab
2. Click "Create App Ad"
3. Configure:
   - **Name:** e.g., "Home Banner Android"
   - **Ad Type:** Banner, Interstitial, Rewarded, etc.
   - **Platform:** Android, iOS, or Both
   - **Placement:** Where the ad appears in the app
   - **Ad Unit ID:** Your AdMob ad unit ID
   - **Test Mode:** Enable for testing

#### For Android Native Config
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="YOUR_ADMOB_APP_ID"/>
```

#### For iOS Native Config
Add to `ios/App/App/Info.plist`:
```xml
<key>GADApplicationIdentifier</key>
<string>YOUR_ADMOB_APP_ID</string>
```

### 7. Run the App

```bash
# Android
npx cap run android

# iOS
npx cap run ios
```

## AdMob Integration Details

The native app fetches all AdMob settings from your Supabase database:

| Table | Purpose |
|-------|---------|
| `app_ad_settings` | Global settings (enabled, test mode, app IDs) |
| `app_ads` | Individual ad units with placements |

### Supported Ad Types
- **Banner:** Small ads at top/bottom of screen
- **Interstitial:** Full-screen ads between content
- **Rewarded:** Video ads that give users rewards
- **Native:** Custom ads matching app design
- **App Open:** Ads shown when app opens/resumes

### Ad Placements
- `home_banner` - Home screen banner
- `watch_top_banner` - Above video player
- `watch_bottom_banner` - Below video player
- `episode_interstitial` - Between episodes
- `reward_unlock` - Reward to unlock content
- And more...

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
- Check "Ads for App (AdMob)" settings in admin dashboard
- Ensure "Enable Ads" is turned ON
- Verify Ad Unit IDs are correct for the platform
- Test on real device (emulators may have issues)
- Check that ads are set to "Active" status

### Settings not updating in app
- The app caches settings on startup
- Restart the app to fetch new settings
- Or call `refreshAdSettings()` programmatically
