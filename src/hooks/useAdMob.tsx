import { useState, useEffect, useCallback } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';
import { isNativeApp, getPlatform } from '@/hooks/useNativeApp';
import { supabase } from '@/integrations/supabase/client';

// Default Test Ad Unit IDs (used as fallback)
const DEFAULT_TEST_ADS = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  }
};

interface AdMobConfig {
  enabled: boolean;
  testMode: boolean;
  androidAppId: string;
  iosAppId: string;
  ads: {
    id: string;
    name: string;
    ad_type: string;
    ad_unit_id: string;
    platform: string;
    placement: string;
    is_active: boolean;
    is_test_mode: boolean;
    frequency_cap: number | null;
  }[];
}

export const useAdMob = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);
  const [isRewardedLoaded, setIsRewardedLoaded] = useState(false);
  const [config, setConfig] = useState<AdMobConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const platform = getPlatform();
  const defaultAds = platform === 'ios' ? DEFAULT_TEST_ADS.ios : DEFAULT_TEST_ADS.android;

  // Fetch AdMob settings from Supabase
  useEffect(() => {
    const fetchAdMobSettings = async () => {
      if (!isNativeApp()) {
        setLoading(false);
        return;
      }

      try {
        // Fetch global settings
        const { data: settingsData } = await supabase
          .from('app_ad_settings')
          .select('setting_key, setting_value');

        // Fetch active ads for current platform
        const { data: adsData } = await supabase
          .from('app_ads')
          .select('*')
          .eq('is_active', true)
          .or(`platform.eq.${platform},platform.eq.both`);

        // Parse settings
        let enabled = true;
        let testMode = false;
        let androidAppId = defaultAds.appId;
        let iosAppId = DEFAULT_TEST_ADS.ios.appId;

        settingsData?.forEach((setting) => {
          const value = setting.setting_value as Record<string, unknown>;
          switch (setting.setting_key) {
            case 'global_settings':
              enabled = value.enabled !== false;
              testMode = value.test_mode === true;
              break;
            case 'admob_android_app_id':
              if (value.app_id) androidAppId = value.app_id as string;
              break;
            case 'admob_ios_app_id':
              if (value.app_id) iosAppId = value.app_id as string;
              break;
          }
        });

        setConfig({
          enabled,
          testMode,
          androidAppId,
          iosAppId,
          ads: adsData || [],
        });
      } catch (error) {
        console.error('Error fetching AdMob settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdMobSettings();
  }, [platform]);

  // Get ad unit for a specific type and placement
  const getAdUnit = useCallback((adType: string, placement?: string): string | null => {
    if (!config?.ads?.length) {
      // Fallback to defaults
      switch (adType) {
        case 'banner': return defaultAds.banner;
        case 'interstitial': return defaultAds.interstitial;
        case 'rewarded': return defaultAds.rewarded;
        default: return null;
      }
    }

    // Find matching ad from database
    const matchingAd = config.ads.find(ad => {
      const typeMatch = ad.ad_type === adType;
      const placementMatch = !placement || ad.placement === placement;
      return typeMatch && placementMatch && ad.is_active;
    });

    return matchingAd?.ad_unit_id || null;
  }, [config, defaultAds]);

  // Check if should use test mode
  const isTestMode = useCallback((): boolean => {
    return config?.testMode ?? true;
  }, [config]);

  const initialize = useCallback(async () => {
    if (!isNativeApp() || isInitialized || !config) return;
    if (!config.enabled) {
      console.log('AdMob disabled in settings');
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: isTestMode(),
      });
      setIsInitialized(true);
      console.log('AdMob initialized with settings from dashboard');
    } catch (error) {
      console.error('AdMob init error:', error);
    }
  }, [isInitialized, config, isTestMode]);

  const showBanner = useCallback(async (position: 'top' | 'bottom' = 'bottom', placement?: string) => {
    if (!isNativeApp() || !isInitialized || !config?.enabled) return;

    const adId = getAdUnit('banner', placement);
    if (!adId) {
      console.log('No banner ad configured for placement:', placement);
      return;
    }

    try {
      const options: BannerAdOptions = {
        adId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: isTestMode(),
      };

      await AdMob.showBanner(options);
      setIsBannerVisible(true);
    } catch (error) {
      console.error('Banner error:', error);
    }
  }, [isInitialized, config, getAdUnit, isTestMode]);

  const hideBanner = useCallback(async () => {
    if (!isNativeApp()) return;

    try {
      await AdMob.hideBanner();
      setIsBannerVisible(false);
    } catch (error) {
      console.error('Hide banner error:', error);
    }
  }, []);

  const prepareInterstitial = useCallback(async (placement?: string) => {
    if (!isNativeApp() || !isInitialized || !config?.enabled) return;

    const adId = getAdUnit('interstitial', placement);
    if (!adId) {
      console.log('No interstitial ad configured for placement:', placement);
      return;
    }

    try {
      await AdMob.prepareInterstitial({
        adId,
        isTesting: isTestMode(),
      });
      setIsInterstitialLoaded(true);
    } catch (error) {
      console.error('Prepare interstitial error:', error);
    }
  }, [isInitialized, config, getAdUnit, isTestMode]);

  const showInterstitial = useCallback(async (placement?: string) => {
    if (!isNativeApp() || !config?.enabled) return;

    if (!isInterstitialLoaded) {
      await prepareInterstitial(placement);
    }

    try {
      await AdMob.showInterstitial();
      setIsInterstitialLoaded(false);
      // Prepare next interstitial
      setTimeout(() => prepareInterstitial(placement), 1000);
    } catch (error) {
      console.error('Show interstitial error:', error);
    }
  }, [isInterstitialLoaded, prepareInterstitial, config]);

  const prepareRewarded = useCallback(async (placement?: string) => {
    if (!isNativeApp() || !isInitialized || !config?.enabled) return;

    const adId = getAdUnit('rewarded', placement);
    if (!adId) {
      console.log('No rewarded ad configured for placement:', placement);
      return;
    }

    try {
      await AdMob.prepareRewardVideoAd({
        adId,
        isTesting: isTestMode(),
      });
      setIsRewardedLoaded(true);
    } catch (error) {
      console.error('Prepare rewarded error:', error);
    }
  }, [isInitialized, config, getAdUnit, isTestMode]);

  const showRewarded = useCallback(async (placement?: string): Promise<AdMobRewardItem | null> => {
    if (!isNativeApp() || !config?.enabled) return null;

    if (!isRewardedLoaded) {
      await prepareRewarded(placement);
    }

    return new Promise(async (resolve) => {
      try {
        const listenerHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
          listenerHandle.remove();
          resolve(reward);
        });

        await AdMob.showRewardVideoAd();
        setIsRewardedLoaded(false);
        setTimeout(() => prepareRewarded(placement), 1000);
      } catch (error) {
        console.error('Show rewarded error:', error);
        resolve(null);
      }
    });
  }, [isRewardedLoaded, prepareRewarded, config]);

  // Get all configured ads for a placement
  const getAdsForPlacement = useCallback((placement: string) => {
    return config?.ads?.filter(ad => ad.placement === placement && ad.is_active) || [];
  }, [config]);

  // Check if ads are enabled
  const isAdsEnabled = useCallback(() => {
    return config?.enabled ?? false;
  }, [config]);

  // Initialize when config is loaded
  useEffect(() => {
    if (config && !isInitialized) {
      initialize();
    }
  }, [config, isInitialized, initialize]);

  // Pre-load ads when initialized
  useEffect(() => {
    if (isInitialized && config?.enabled) {
      prepareInterstitial();
      prepareRewarded();
    }
  }, [isInitialized, config?.enabled, prepareInterstitial, prepareRewarded]);

  return {
    isNative: isNativeApp(),
    isInitialized,
    isBannerVisible,
    isInterstitialLoaded,
    isRewardedLoaded,
    loading,
    config,
    showBanner,
    hideBanner,
    showInterstitial,
    showRewarded,
    prepareInterstitial,
    prepareRewarded,
    getAdsForPlacement,
    isAdsEnabled,
    isTestMode: isTestMode(),
  };
};
