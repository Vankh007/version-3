import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Check if running in a native app environment
export const isExoPlayerAvailable = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

// Play video using native ExoPlayer intent (Android only)
// For iOS, falls back to opening in system browser
export const playWithExoPlayer = async (
  videoUrl: string,
  title?: string,
  subtitle?: string
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not a native app, cannot use ExoPlayer');
    return false;
  }

  try {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'android') {
      // For Android, we attempt to open the video in an external player
      // This relies on the device having a compatible video player installed
      // ExoPlayer-based apps like VLC, MX Player can handle this
      
      const intentUrl = `intent://${encodeURIComponent(videoUrl)}#Intent;scheme=https;type=video/*;S.title=${encodeURIComponent(title || 'Video')};end`;
      
      try {
        // Try opening with an intent first
        await Browser.open({ 
          url: videoUrl,
          presentationStyle: 'fullscreen',
          toolbarColor: '#000000'
        });
        return true;
      } catch (intentError) {
        console.log('Intent failed, using browser:', intentError);
        // Fallback to browser
        await Browser.open({ url: videoUrl });
        return true;
      }
    } else if (platform === 'ios') {
      // For iOS, open in browser which can handle most video formats
      await Browser.open({ 
        url: videoUrl,
        presentationStyle: 'fullscreen'
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error opening video with native player:', error);
    return false;
  }
};

// Custom hook for ExoPlayer functionality
export const useExoPlayer = () => {
  const isAvailable = isExoPlayerAvailable();
  
  const play = async (
    videoUrl: string,
    title?: string,
    subtitle?: string
  ): Promise<boolean> => {
    return playWithExoPlayer(videoUrl, title, subtitle);
  };
  
  return {
    isAvailable,
    play,
    playWithExoPlayer,
  };
};

export default useExoPlayer;
