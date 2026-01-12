import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plexkhmerzoon',
  appName: 'Khmerzoon-Tv',
  webDir: 'dist',
  server: {
    url: 'https://khmerzoon.biz',
    cleartext: true
  },
  plugins: {
    Browser: {
      // Browser plugin configuration for OAuth
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    AdMob: {
      // AdMob configuration - add your App ID here
      // For Android: ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
      // For iOS: ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false
  }
};

export default config;
