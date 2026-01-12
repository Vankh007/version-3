import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plexkhmerzoon',
  appName: 'Khmerzoon-Tv',
  webDir: 'dist',
  server: {
    url: 'https://khmerzoon.biz',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    ScreenOrientation: {
      // Allow orientation changes to be managed programmatically
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    AdMob: {
      // AdMob settings are loaded from Supabase app_ad_settings
    },
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
    webContentsDebuggingEnabled: false
  },
  ios: {
    backgroundColor: '#000000',
    contentInset: 'automatic'
  }
};

export default config;
