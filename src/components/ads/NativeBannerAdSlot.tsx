import { useEffect, useState } from 'react';
import { useAdMob } from '@/hooks/useAdMob';
import { isNativeApp } from '@/hooks/useNativeApp';
import { cn } from '@/lib/utils';

interface NativeBannerAdSlotProps {
  placement?: string;
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * NativeBannerAdSlot - Displays AdMob banner ads in native apps
 * 
 * This component handles banner ad display for native Android/iOS apps.
 * It only renders when running in a native context and ads are enabled.
 * 
 * @param placement - The placement identifier for the ad (e.g., 'watch_screen_bottom_banner')
 * @param position - Whether to show at 'top' or 'bottom' (default: bottom)
 * @param className - Additional CSS classes
 */
export const NativeBannerAdSlot = ({ 
  placement = 'default_banner',
  position = 'bottom',
  className 
}: NativeBannerAdSlotProps) => {
  const { 
    isNative, 
    isInitialized, 
    showBanner, 
    hideBanner, 
    isBannerVisible,
    isAdsEnabled,
    config
  } = useAdMob();
  
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only proceed if we're in a native app and AdMob is initialized
    if (!isNative || !isInitialized) {
      return;
    }

    // Check if ads are enabled
    if (!isAdsEnabled()) {
      return;
    }

    // Check if there's a banner ad configured for this placement
    const hasAd = config?.ads?.some(
      ad => ad.ad_type === 'banner' && 
            (ad.placement === placement || ad.placement === 'all') && 
            ad.is_active
    );

    if (hasAd || config?.ads?.length === 0) {
      // Show banner if ad exists for placement or using default ads
      setShouldShow(true);
      showBanner(position, placement);
    }

    // Cleanup: hide banner when component unmounts
    return () => {
      if (isBannerVisible) {
        hideBanner();
      }
    };
  }, [isNative, isInitialized, isAdsEnabled, placement, position, config?.ads]);

  // Don't render anything for web or when ads are not enabled
  if (!isNativeApp() || !shouldShow) {
    return null;
  }

  // Return a spacer div to account for the native banner ad space
  // The actual ad is rendered natively by AdMob, this just reserves space
  return (
    <div 
      className={cn(
        "w-full flex items-center justify-center",
        // Typical adaptive banner height ranges from 50-90px depending on device
        "min-h-[60px] max-h-[90px]",
        className
      )}
      role="region"
      aria-label="Advertisement"
    >
      {/* Native AdMob banner is rendered here by the platform */}
      <div className="text-xs text-muted-foreground/50 text-center">
        {!isBannerVisible && 'Loading ad...'}
      </div>
    </div>
  );
};

export default NativeBannerAdSlot;
