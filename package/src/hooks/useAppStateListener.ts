import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppStateListener = (onForeground?: () => void, onBackground?: () => void) => {
  // React Native 0.87 widened `AppState.currentState` to `string | null | undefined` (it was
  // `AppStateStatus` up to 0.86). Normalise once here so the comparisons below stay total on
  // every supported version.
  const isBackgroundedRef = useRef(
    ((AppState.currentState as AppStateStatus | null | undefined) ?? 'unknown') === 'background',
  );
  const onForegroundRef = useRef(onForeground);
  const onBackgroundRef = useRef(onBackground);

  // setting refs to avoid passing the functions as dependencies to useEffect
  onForegroundRef.current = onForeground;
  onBackgroundRef.current = onBackground;

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Only `background` is backgrounded. `inactive` is visible-but-unfocused, and from iOS 27 an
      // app in Split View stays `inactive` the whole time it is side by side. Transitions pass
      // through `inactive` in both directions, so ignoring it still observes both.
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
      // Following if-else logic is to support RN >= 0.65 and RN < 0.65 versions.
      // https://github.com/react-native-community/releases/blob/master/CHANGELOG.md#:~:text=EventEmitter%23removeSubscription%20is%20now%20deprecated.%20(cb6cbd12f8%20by%20%40yungsters)
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
