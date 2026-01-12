import { useState, useEffect, useCallback } from 'react';

// Global fullscreen state management for PWA
let globalIsFullscreen = false;
const listeners = new Set<(isFullscreen: boolean) => void>();

export function getGlobalFullscreenState(): boolean {
  return globalIsFullscreen;
}

export function setGlobalFullscreenState(value: boolean): void {
  globalIsFullscreen = value;
  listeners.forEach(listener => listener(value));
}

/**
 * Hook to subscribe to global fullscreen state changes
 */
export function useFullscreenState(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(globalIsFullscreen);

  useEffect(() => {
    const listener = (newValue: boolean) => setIsFullscreen(newValue);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return isFullscreen;
}

/**
 * PWA-compatible hook to handle fullscreen for video/iframe embeds
 * Uses Web Fullscreen API
 */
export function useIframeFullscreenHandler() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleEnterFullscreen = useCallback(async () => {
    setIsFullscreen(true);
    setGlobalFullscreenState(true);
    console.log('[PWA] Fullscreen entered');
  }, []);

  const handleExitFullscreen = useCallback(async () => {
    setIsFullscreen(false);
    setGlobalFullscreenState(false);
    console.log('[PWA] Fullscreen exited');
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      
      if (isInFullscreen) {
        handleEnterFullscreen();
      } else {
        handleExitFullscreen();
      }
    };

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, [handleEnterFullscreen, handleExitFullscreen]);

  return isFullscreen;
}

/**
 * Toggle fullscreen for a given element
 */
export async function toggleFullscreen(element?: HTMLElement): Promise<boolean> {
  const target = element || document.documentElement;
  
  const isCurrentlyFullscreen = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement
  );

  try {
    if (isCurrentlyFullscreen) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
      return false;
    } else {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      }
      return true;
    }
  } catch (error) {
    console.log('Fullscreen toggle failed:', error);
    return isCurrentlyFullscreen;
  }
}
