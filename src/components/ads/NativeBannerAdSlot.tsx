import { useEffect, useState, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import AdSlot from './AdSlot';

interface AppAd {
  id: string;
  name: string;
  ad_type: string;
  ad_unit_id: string;
  platform: string;
  placement: string;
  is_active: boolean;
  is_test_mode: boolean;
  priority: number;
}

interface AdMobSettings {
  enabled: boolean;
  test_mode: boolean;
}

interface NativeBannerAdSlotProps {
  placement: string;
  className?: string;
  position?: 'top' | 'bottom';
  pageLocation?: string;
}

// AdMob Plugin interface
interface AdMobPlugin {
  showBanner: (options: {
    adId: string;
    adSize?: string;
    position?: 'TOP_CENTER' | 'BOTTOM_CENTER';
    margin?: number;
    isTesting?: boolean;
  }) => Promise<void>;
  hideBanner: () => Promise<void>;
}

// Get AdMob plugin
const getAdMobPlugin = (): AdMobPlugin | null => {
  try {
    const AdMob = (window as any).Capacitor?.Plugins?.AdMob || (window as any).AdMob;
    return AdMob || null;
  } catch {
    return null;
  }
};

/**
 * Native AdMob banner ad slot for Capacitor apps
 * Falls back to web ads for non-native platforms
 * Supports all ad types configured in admin dashboard
 */
export function NativeBannerAdSlot({ placement, className = '', position = 'bottom', pageLocation = 'watch' }: NativeBannerAdSlotProps) {
  const [isNative, setIsNative] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerShown, setBannerShown] = useState(false);
  const [webAdCode, setWebAdCode] = useState<string | null>(null);
  const [adConfig, setAdConfig] = useState<{ ad: AppAd; settings: AdMobSettings } | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isInView, setIsInView] = useState(false);

  // Check if native platform
  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    
    if (native) {
      fetchAdConfig();
    } else {
      fetchWebAd();
    }
  }, [placement]);

  // Intersection observer to track visibility
  useEffect(() => {
    if (!slotRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        setIsInView(isVisible);
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(slotRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Fetch native AdMob config from Supabase - supports all ad types
  const fetchAdConfig = async () => {
    try {
      const platform = Capacitor.getPlatform();
      
      // Fetch ad for this placement - any ad type for more flexibility
      const { data: adsData } = await supabase
        .from('app_ads')
        .select('*')
        .eq('is_active', true)
        .eq('placement', placement)
        .or(`platform.eq.${platform},platform.eq.both`)
        .order('priority', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch global settings
      const { data: settingsData } = await supabase
        .from('app_ad_settings')
        .select('*')
        .eq('setting_key', 'global_settings')
        .maybeSingle();

      const rawSettings = settingsData?.setting_value as Record<string, unknown> | null;
      const settings: AdMobSettings = {
        enabled: (rawSettings?.enabled as boolean) ?? true,
        test_mode: (rawSettings?.test_mode as boolean) ?? true,
      };
      
      if (adsData && settings.enabled) {
        setAdConfig({ ad: adsData, settings });
        console.log('[NativeBannerAd] Loaded config for placement:', placement, adsData.name, 'type:', adsData.ad_type);
      } else {
        console.log('[NativeBannerAd] No active ad found for placement:', placement);
        // Try fetching web ad as fallback
        fetchWebAd();
      }
    } catch (error) {
      console.error('[NativeBannerAd] Error fetching config:', error);
      fetchWebAd();
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch web ad as fallback
  const fetchWebAd = async () => {
    try {
      const { data } = await supabase
        .from('ads')
        .select('ad_code, image_url, link_url')
        .eq('placement', placement)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.ad_code) {
        setWebAdCode(data.ad_code);
      }
    } catch (error) {
      console.log('[NativeBannerAd] Could not fetch web ad for placement:', placement);
    } finally {
      setIsLoading(false);
    }
  };

  // Show native AdMob banner
  const showBanner = useCallback(async () => {
    if (!adConfig || bannerShown || !isInView) return;

    const AdMob = getAdMobPlugin();
    if (!AdMob) {
      console.log('[NativeBannerAd] AdMob plugin not available');
      return;
    }

    try {
      const { ad, settings } = adConfig;
      const useTestMode = settings.test_mode || ad.is_test_mode;
      const adPosition = position === 'top' ? 'TOP_CENTER' : 'BOTTOM_CENTER';

      await AdMob.showBanner({
        adId: ad.ad_unit_id,
        adSize: 'ADAPTIVE_BANNER',
        position: adPosition,
        isTesting: useTestMode,
      });

      setBannerShown(true);
      console.log('[NativeBannerAd] Banner shown for placement:', placement);
    } catch (error) {
      console.error('[NativeBannerAd] Failed to show banner:', error);
    }
  }, [adConfig, bannerShown, isInView, placement, position]);

  // Hide native AdMob banner
  const hideBanner = useCallback(async () => {
    if (!bannerShown) return;

    const AdMob = getAdMobPlugin();
    if (!AdMob) return;

    try {
      await AdMob.hideBanner();
      setBannerShown(false);
      console.log('[NativeBannerAd] Banner hidden');
    } catch (error) {
      console.error('[NativeBannerAd] Failed to hide banner:', error);
    }
  }, [bannerShown]);

  // Show/hide banner based on visibility
  useEffect(() => {
    if (!isNative || !adConfig) return;

    if (isInView) {
      showBanner();
    } else if (bannerShown) {
      hideBanner();
    }
  }, [isNative, adConfig, isInView, showBanner, hideBanner, bannerShown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isNative && bannerShown) {
        const AdMob = getAdMobPlugin();
        AdMob?.hideBanner?.().catch(() => {});
      }
    };
  }, [isNative, bannerShown]);

  // Native platform - render placeholder div for positioning
  if (isNative) {
    if (isLoading) {
      return (
        <div ref={slotRef} className={`w-full h-12 bg-muted/30 animate-pulse flex items-center justify-center ${className}`}>
          <span className="text-xs text-muted-foreground">Loading Ad...</span>
        </div>
      );
    }

    if (!adConfig) {
      return null; // No ad configured
    }

    // Native banner will overlay on top, this is just a spacer
    return (
      <div 
        ref={slotRef} 
        className={`w-full h-[60px] ${className}`}
        data-placement={placement}
        data-banner-active={bannerShown}
      />
    );
  }

  // Web platform - show web ads
  if (webAdCode) {
    return (
      <div 
        ref={slotRef}
        className={`w-full ${className}`}
        dangerouslySetInnerHTML={{ __html: webAdCode }}
      />
    );
  }

  // Fallback to regular AdSlot component
  if (!isLoading) {
    return <AdSlot placement={placement} pageLocation={pageLocation} className={className} />;
  }

  return null;
}

export default NativeBannerAdSlot;
