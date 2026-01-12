/**
 * Immersive mode utilities for fullscreen video playback
 * Works with both Web Fullscreen API and Capacitor native
 * 
 * IMPORTANT: On Android, immersive mode and orientation lock can conflict.
 * This module sequences the operations correctly:
 * 1. First lock orientation
 * 2. Wait for orientation to settle
 * 3. Then enter immersive mode
 */
import { Capacitor } from '@capacitor/core';
import { hideStatusBar, showStatusBar, enterImmersiveFullscreen, exitImmersiveFullscreen } from './useNativeStatusBar';

/**
 * Enter immersive fullscreen mode using Web Fullscreen API
 * This hides browser UI including address bar
 */
export async function enterImmersiveMode(element?: HTMLElement): Promise<void> {
  const isNative = Capacitor.isNativePlatform();
  
  // For native apps, use StatusBar plugin for true immersive mode
  if (isNative) {
    try {
      await enterImmersiveFullscreen();
    } catch (error) {
      console.log('[Immersive] Native immersive failed, using fallback:', error);
    }
  }
  
  // Also use Web Fullscreen API as it helps hide Android navigation bar
  try {
    const target = element || document.documentElement;
    
    if (target.requestFullscreen) {
      await target.requestFullscreen();
    } else if ((target as any).webkitRequestFullscreen) {
      await (target as any).webkitRequestFullscreen();
    } else if ((target as any).mozRequestFullScreen) {
      await (target as any).mozRequestFullScreen();
    } else if ((target as any).msRequestFullscreen) {
      await (target as any).msRequestFullscreen();
    }
    console.log('[Immersive] Entered immersive mode via Fullscreen API');
  } catch (error) {
    console.log('[Immersive] Fullscreen not supported or blocked:', error);
  }
}

/**
 * Exit immersive mode
 */
export async function exitImmersiveMode(): Promise<void> {
  const isNative = Capacitor.isNativePlatform();
  
  // Exit native immersive mode
  if (isNative) {
    try {
      await exitImmersiveFullscreen();
    } catch (error) {
      console.log('[Immersive] Native exit failed:', error);
    }
  }
  
  // Exit web fullscreen
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
    console.log('[Immersive] Exited immersive mode');
  } catch (error) {
    console.log('[Immersive] Exit fullscreen failed:', error);
  }
}

/**
 * Check if currently in fullscreen/immersive mode
 */
export function isInImmersiveMode(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Combined function for video fullscreen:
 * Enters fullscreen with proper sequencing for all Android versions
 * 
 * @param container - The container element to make fullscreen
 * @param onOrientationLocked - Callback to lock orientation BEFORE entering immersive mode
 */
export async function enterVideoFullscreen(
  container: HTMLElement,
  onOrientationLocked?: () => Promise<void>
): Promise<void> {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // STEP 1: Lock orientation first (caller provides this)
    if (onOrientationLocked) {
      await onOrientationLocked();
      // Wait for orientation to fully settle
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // STEP 2: Enter immersive mode (hide status bar)
    await hideStatusBar();
    
    // STEP 3: Small delay before fullscreen request
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // STEP 4: Request fullscreen on container
  try {
    if (container.requestFullscreen) {
      // On some Android WebViews (older OEM builds like OPPO), passing navigationUI:'hide'
      // increases the chance the system navigation bar fully hides.
      const anyContainer = container as any;
      try {
        await anyContainer.requestFullscreen({ navigationUI: 'hide' });
      } catch {
        await container.requestFullscreen();
      }
    } else if ((container as any).webkitRequestFullscreen) {
      await (container as any).webkitRequestFullscreen();
    } else if ((container as any).mozRequestFullScreen) {
      await (container as any).mozRequestFullScreen();
    } else if ((container as any).msRequestFullscreen) {
      await (container as any).msRequestFullscreen();
    }
    console.log('[Immersive] Video fullscreen entered successfully');
  } catch (error) {
    console.error('[Immersive] Failed to enter video fullscreen:', error);
    // Even if fullscreen fails, keep orientation locked for video viewing
  }
}

/**
 * Combined function for exiting video fullscreen:
 * Exits with proper sequencing for all Android versions
 * 
 * @param onOrientationUnlocked - Callback to unlock/reset orientation AFTER exiting immersive mode
 */
export async function exitVideoFullscreen(
  onOrientationUnlocked?: () => Promise<void>
): Promise<void> {
  const isNative = Capacitor.isNativePlatform();
  
  // STEP 1: Exit fullscreen first
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  } catch (error) {
    console.log('[Immersive] Exit fullscreen error:', error);
  }
  
  if (isNative) {
    // STEP 2: Wait for fullscreen exit to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // STEP 3: Show status bar
    await showStatusBar();
    
    // STEP 4: Reset orientation (caller provides this)
    if (onOrientationUnlocked) {
      await new Promise(resolve => setTimeout(resolve, 50));
      await onOrientationUnlocked();
    }
  }
  
  console.log('[Immersive] Video fullscreen exited successfully');
}
