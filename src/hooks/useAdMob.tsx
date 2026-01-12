import { useState, useEffect, useCallback } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';
import { isNativeApp, getPlatform } from '@/hooks/useNativeApp';

// Test Ad Unit IDs - Replace with your production IDs
const AD_CONFIG = {
  android: {
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY', // Replace with your Android App ID
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ', // Replace with your iOS App ID
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  }
};

export const useAdMob = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);
  const [isRewardedLoaded, setIsRewardedLoaded] = useState(false);

  const platform = getPlatform();
  const config = platform === 'ios' ? AD_CONFIG.ios : AD_CONFIG.android;

  const initialize = useCallback(async () => {
    if (!isNativeApp() || isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: true, // Set to false in production
      });
      setIsInitialized(true);
      console.log('AdMob initialized');
    } catch (error) {
      console.error('AdMob init error:', error);
    }
  }, [isInitialized]);

  const showBanner = useCallback(async (position: 'top' | 'bottom' = 'bottom') => {
    if (!isNativeApp() || !isInitialized) return;

    try {
      const options: BannerAdOptions = {
        adId: config.banner,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
      };

      await AdMob.showBanner(options);
      setIsBannerVisible(true);
    } catch (error) {
      console.error('Banner error:', error);
    }
  }, [isInitialized, config.banner]);

  const hideBanner = useCallback(async () => {
    if (!isNativeApp()) return;

    try {
      await AdMob.hideBanner();
      setIsBannerVisible(false);
    } catch (error) {
      console.error('Hide banner error:', error);
    }
  }, []);

  const prepareInterstitial = useCallback(async () => {
    if (!isNativeApp() || !isInitialized) return;

    try {
      await AdMob.prepareInterstitial({
        adId: config.interstitial,
        isTesting: true,
      });
      setIsInterstitialLoaded(true);
    } catch (error) {
      console.error('Prepare interstitial error:', error);
    }
  }, [isInitialized, config.interstitial]);

  const showInterstitial = useCallback(async () => {
    if (!isNativeApp() || !isInterstitialLoaded) {
      await prepareInterstitial();
    }

    try {
      await AdMob.showInterstitial();
      setIsInterstitialLoaded(false);
      // Prepare next interstitial
      setTimeout(prepareInterstitial, 1000);
    } catch (error) {
      console.error('Show interstitial error:', error);
    }
  }, [isInterstitialLoaded, prepareInterstitial]);

  const prepareRewarded = useCallback(async () => {
    if (!isNativeApp() || !isInitialized) return;

    try {
      await AdMob.prepareRewardVideoAd({
        adId: config.rewarded,
        isTesting: true,
      });
      setIsRewardedLoaded(true);
    } catch (error) {
      console.error('Prepare rewarded error:', error);
    }
  }, [isInitialized, config.rewarded]);

  const showRewarded = useCallback(async (): Promise<AdMobRewardItem | null> => {
    if (!isNativeApp()) return null;

    if (!isRewardedLoaded) {
      await prepareRewarded();
    }

    return new Promise(async (resolve) => {
      try {
        const listenerHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
          listenerHandle.remove();
          resolve(reward);
        });

        await AdMob.showRewardVideoAd();
        setIsRewardedLoaded(false);
        setTimeout(prepareRewarded, 1000);
      } catch (error) {
        console.error('Show rewarded error:', error);
        resolve(null);
      }
    });
  }, [isRewardedLoaded, prepareRewarded]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Pre-load ads when initialized
  useEffect(() => {
    if (isInitialized) {
      prepareInterstitial();
      prepareRewarded();
    }
  }, [isInitialized, prepareInterstitial, prepareRewarded]);

  return {
    isNative: isNativeApp(),
    isInitialized,
    isBannerVisible,
    isInterstitialLoaded,
    isRewardedLoaded,
    showBanner,
    hideBanner,
    showInterstitial,
    showRewarded,
    prepareInterstitial,
    prepareRewarded,
  };
};
