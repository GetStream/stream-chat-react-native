import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppStateListener = (onForeground?: () => void, onBackground?: () => void) => {
  // `AppState.currentState` is `string | null | undefined` from React Native 0.87 and
  // `AppStateStatus` before. Normalized so the comparison holds on every supported version.
  const isBackgroundedRef = useRef(
    ((AppState.currentState as AppStateStatus | null | undefined) ?? 'unknown') === 'background',
  );
  const onForegroundRef = useRef(onForeground);
  const onBackgroundRef = useRef(onBackground);

  // Refs keep the handlers out of the effect's dependencies.
  onForegroundRef.current = onForeground;
  onBackgroundRef.current = onBackground;

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Only `background` counts as backgrounded. `inactive` is visible-but-unfocused, and from
      // iOS 27 an app in Split View stays `inactive` the whole time it is side by side. Transitions
      // pass through `inactive` in both directions, so ignoring it still observes both.
      if (nextAppState === 'background') {
        if (!isBackgroundedRef.current) {
          isBackgroundedRef.current = true;
          onBackgroundRef.current?.();
        }
        return;
      }

      if (nextAppState === 'active' && isBackgroundedRef.current) {
        isBackgroundedRef.current = false;
        onForegroundRef.current?.();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // React Native < 0.65 has no `subscription.remove`; fall back to `removeEventListener`.
      if (subscription?.remove) {
        subscription.remove();
      } else {
        // @ts-ignore
        if (AppState.removeEventListener) {
          // @ts-ignore
          AppState.removeEventListener('change', handleAppStateChange);
        }
      }
    };
  }, []);
};
