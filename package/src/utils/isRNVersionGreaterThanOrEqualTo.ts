import { Platform } from 'react-native';

/**
 * Whether the running React Native version is greater than or equal to `version`.
 *
 * Returns `false` when the version is unavailable (such as react-native-web), so callers treat it
 * as an older React Native.
 *
 * @param version A `'major.minor.patch'` string, such as `'0.86.0'`.
 * @returns Whether the running version is at least `version`.
 */
export const isRNVersionGreaterThanOrEqualTo = (version: string): boolean => {
  const runtime = Platform.constants?.reactNativeVersion;
  if (!runtime) {
    return false;
  }

  const current = [runtime.major, runtime.minor, runtime.patch ?? 0];
  const target = version.split('.').map((part) => parseInt(part, 10) || 0);

  for (let i = 0; i < current.length; i++) {
    const wanted = target[i] ?? 0;
    if (current[i] !== wanted) {
      return current[i] > wanted;
    }
  }

  return true;
};
