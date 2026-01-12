import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';
import { isNativeApp } from '@/hooks/useNativeApp';

// Test Ad Unit IDs (replace with your production IDs)
const AD_UNITS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111', // Test banner
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial
    rewarded: 'ca-app-pub-3940256099942544/5224354917', // Test rewarded
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716', // Test banner
    interstitial: 'ca-app-pub-3940256099942544/4411468910', // Test interstitial
    rewarded: 'ca-app-pub-3940256099942544/1712485313', // Test rewarded
  }
};

let isInitialized = false;

export const initializeAdMob = async (): Promise<void> => {
  if (!isNativeApp() || isInitialized) return;

  try {
    await AdMob.initialize({
      initializeForTesting: true, // Set to false in production
    });
    isInitialized = true;
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.error('Error initializing AdMob:', error);
  }
};

export const showBannerAd = async (position: 'top' | 'bottom' = 'bottom'): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    const options: BannerAdOptions = {
      adId: AD_UNITS.android.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
    };

    await AdMob.showBanner(options);
    console.log('Banner ad shown');
  } catch (error) {
    console.error('Error showing banner ad:', error);
  }
};

export const hideBannerAd = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    await AdMob.hideBanner();
    console.log('Banner ad hidden');
  } catch (error) {
    console.error('Error hiding banner ad:', error);
  }
};

export const showInterstitialAd = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    await AdMob.prepareInterstitial({
      adId: AD_UNITS.android.interstitial,
      isTesting: true,
    });

    await AdMob.showInterstitial();
    console.log('Interstitial ad shown');
  } catch (error) {
    console.error('Error showing interstitial ad:', error);
  }
};

export const showRewardedAd = async (): Promise<AdMobRewardItem | null> => {
  if (!isNativeApp()) return null;

  return new Promise(async (resolve) => {
    try {
      const listenerHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        console.log('User earned reward:', reward);
        listenerHandle.remove();
        resolve(reward);
      });

      await AdMob.prepareRewardVideoAd({
        adId: AD_UNITS.android.rewarded,
        isTesting: true,
      });

      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      resolve(null);
    }
  });
};

export const setTestDeviceIds = async (deviceIds: string[]): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    console.log('Test device IDs:', deviceIds);
  } catch (error) {
    console.error('Error setting test device IDs:', error);
  }
};

export const useAdMobService = () => {
  return {
    initialize: initializeAdMob,
    showBanner: showBannerAd,
    hideBanner: hideBannerAd,
    showInterstitial: showInterstitialAd,
    showRewarded: showRewardedAd,
    isNative: isNativeApp(),
  };
};
