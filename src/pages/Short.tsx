import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import MobileShortsFeed from '@/components/MobileShortsFeed';
import DesktopShortsFeed from '@/components/DesktopShortsFeed';
import BottomNav from '@/components/BottomNav';

const Short = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Use mobile feed for both mobile and tablet
  if (isMobile || isTablet) {
    return (
      <>
        <MobileShortsFeed />
        <BottomNav />
      </>
    );
  }

  return <DesktopShortsFeed />;
};

export default Short;
