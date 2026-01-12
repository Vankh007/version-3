import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';
import { isNativeApp, getPlatform } from '@/hooks/useNativeApp';
import { supabase } from '@/integrations/supabase/client';

// Default Test Ad Unit IDs
const DEFAULT_TEST_ADS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  }
};

let isInitialized = false;
let cachedSettings: {
  enabled: boolean;
  testMode: boolean;
  ads: any[];
} | null = null;

// Fetch settings from Supabase
const fetchSettings = async () => {
  if (!isNativeApp()) return null;

  try {
    const platform = getPlatform();

    const { data: settingsData } = await supabase
      .from('app_ad_settings')
      .select('setting_key, setting_value');

    const { data: adsData } = await supabase
      .from('app_ads')
      .select('*')
      .eq('is_active', true)
      .or(`platform.eq.${platform},platform.eq.both`);

    let enabled = true;
    let testMode = false;

    settingsData?.forEach((setting) => {
      const value = setting.setting_value as Record<string, unknown>;
      if (setting.setting_key === 'global_settings') {
        enabled = value.enabled !== false;
        testMode = value.test_mode === true;
      }
    });

    cachedSettings = {
      enabled,
      testMode,
      ads: adsData || [],
    };

    return cachedSettings;
  } catch (error) {
    console.error('Error fetching AdMob settings:', error);
    return null;
  }
};

const getAdUnit = (adType: string, placement?: string): string | null => {
  const platform = getPlatform();
  const defaults = platform === 'ios' ? DEFAULT_TEST_ADS.ios : DEFAULT_TEST_ADS.android;

  if (!cachedSettings?.ads?.length) {
    switch (adType) {
      case 'banner': return defaults.banner;
      case 'interstitial': return defaults.interstitial;
      case 'rewarded': return defaults.rewarded;
      default: return null;
    }
  }

  const matchingAd = cachedSettings.ads.find(ad => {
    const typeMatch = ad.ad_type === adType;
    const placementMatch = !placement || ad.placement === placement;
    return typeMatch && placementMatch && ad.is_active;
  });

  return matchingAd?.ad_unit_id || null;
};

export const initializeAdMob = async (): Promise<void> => {
  if (!isNativeApp() || isInitialized) return;

  // Fetch settings first
  await fetchSettings();

  if (cachedSettings && !cachedSettings.enabled) {
    console.log('AdMob disabled in dashboard settings');
    return;
  }

  try {
    await AdMob.initialize({
      initializeForTesting: cachedSettings?.testMode ?? true,
    });
    isInitialized = true;
    console.log('AdMob initialized from dashboard settings');
  } catch (error) {
    console.error('Error initializing AdMob:', error);
  }
};

export const showBannerAd = async (position: 'top' | 'bottom' = 'bottom', placement?: string): Promise<void> => {
  if (!isNativeApp() || !cachedSettings?.enabled) return;

  const adId = getAdUnit('banner', placement);
  if (!adId) return;

  try {
    const options: BannerAdOptions = {
      adId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: cachedSettings?.testMode ?? true,
    };

    await AdMob.showBanner(options);
  } catch (error) {
    console.error('Error showing banner ad:', error);
  }
};

export const hideBannerAd = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error('Error hiding banner ad:', error);
  }
};

export const showInterstitialAd = async (placement?: string): Promise<void> => {
  if (!isNativeApp() || !cachedSettings?.enabled) return;

  const adId = getAdUnit('interstitial', placement);
  if (!adId) return;

  try {
    await AdMob.prepareInterstitial({
      adId,
      isTesting: cachedSettings?.testMode ?? true,
    });

    await AdMob.showInterstitial();
  } catch (error) {
    console.error('Error showing interstitial ad:', error);
  }
};

export const showRewardedAd = async (placement?: string): Promise<AdMobRewardItem | null> => {
  if (!isNativeApp() || !cachedSettings?.enabled) return null;

  const adId = getAdUnit('rewarded', placement);
  if (!adId) return null;

  return new Promise(async (resolve) => {
    try {
      const listenerHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        listenerHandle.remove();
        resolve(reward);
      });

      await AdMob.prepareRewardVideoAd({
        adId,
        isTesting: cachedSettings?.testMode ?? true,
      });

      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      resolve(null);
    }
  });
};

export const isAdsEnabled = (): boolean => {
  return cachedSettings?.enabled ?? false;
};

export const isTestModeEnabled = (): boolean => {
  return cachedSettings?.testMode ?? true;
};

export const refreshAdSettings = async (): Promise<void> => {
  await fetchSettings();
};

export const useAdMobService = () => {
  return {
    initialize: initializeAdMob,
    showBanner: showBannerAd,
    hideBanner: hideBannerAd,
    showInterstitial: showInterstitialAd,
    showRewarded: showRewardedAd,
    isNative: isNativeApp(),
    isEnabled: isAdsEnabled,
    isTestMode: isTestModeEnabled,
    refresh: refreshAdSettings,
  };
};
