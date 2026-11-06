import { adb } from './AndroidSystemDialogs';

/**
 * Device-level controls, like `device.*` in the Android suite's uiautomator helpers. The internet
 * connection can only be cut on Android (`svc`); the iOS simulator shares the Mac's network.
 */
export const disableInternetConnection = (): Promise<void> => {
  assertAndroid('disableInternetConnection');
  adb('shell', 'svc', 'wifi', 'disable');
  adb('shell', 'svc', 'data', 'disable');
  return Promise.resolve();
};

export const enableInternetConnection = (): Promise<void> => {
  assertAndroid('enableInternetConnection');
  adb('shell', 'svc', 'wifi', 'enable');
  adb('shell', 'svc', 'data', 'enable');
  return Promise.resolve();
};

/**
 * Detox waits for in-flight requests before every action, so a delayed send would be done before
 * the test could see it pending. Stops it from waiting on message sends until the app relaunches.
 */
export const ignoreMessageSendsForSync = () => device.setURLBlacklist(['.*/message(\\?.*)?$']);

export const goToBackground = () => device.sendToHome();

export const goToForeground = () => device.launchApp({ newInstance: false });

export const isIOS = () => device.getPlatform() === 'ios';

const assertAndroid = (name: string) => {
  if (device.getPlatform() !== 'android') {
    throw new Error(`${name} is only supported on Android`);
  }
};
