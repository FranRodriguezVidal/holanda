export type DevicePlatform = 'ios' | 'android' | 'other';

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const isDisplayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isDisplayModeStandalone || isIosStandalone;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function getDevicePlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') {
    return 'other';
  }

  const userAgent = navigator.userAgent.toLowerCase();
  if (/android/.test(userAgent)) {
    return 'android';
  }
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  return 'other';
}
