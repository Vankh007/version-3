import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plexkhmerzoon',
  appName: 'KHMERZOON',
  webDir: 'dist',
  // No server config - runs from dist folder
  plugins: {
    ScreenOrientation: {
      // Allow orientation changes to be managed programmatically
    },
    StatusBar: {
      // Status bar is managed programmatically
    },
    AdMob: {
      // AdMob settings are loaded from Supabase app_ad_settings
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
    }
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000'
  },
  ios: {
    backgroundColor: '#000000',
    contentInset: 'automatic'
  }
};

export default config;
