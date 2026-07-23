import { Platform } from 'react-native';

/**
 * Returns `true` when the running React Native version is greater than or equal to `version`
 * (a `'major.minor.patch'` string, e.g. `'0.86.0'`), comparing major, then minor, then patch.
 *
 * Falls back to `false` when the version is unavailable (e.g. react-native-web) — callers should
 * treat that as "assume an older React Native".
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
