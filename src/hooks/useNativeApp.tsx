import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useNativeApp = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    const checkPlatform = () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      const currentPlatform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
      
      setIsNative(isNativePlatform);
      setPlatform(currentPlatform);
    };

    checkPlatform();
  }, []);

  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web'
  };
};

export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const getPlatform = (): 'web' | 'ios' | 'android' => {
  try {
    return Capacitor.getPlatform() as 'web' | 'ios' | 'android';
  } catch {
    return 'web';
  }
};
