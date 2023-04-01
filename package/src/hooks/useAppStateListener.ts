import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppStateListener = (onForeground?: () => void, onBackground?: () => void) => {
  const appStateRef = useRef(AppState.currentState);
  const onForegroundRef = useRef(onForeground);
  const onBackgroundRef = useRef(onBackground);

  // setting refs to avoid passing the functions as dependencies to useEffect
  onForegroundRef.current = onForeground;
  onBackgroundRef.current = onBackground;

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const prevAppState = appStateRef.current;
      if (prevAppState.match(/inactive|background/) && nextAppState === 'active') {
        onForegroundRef.current?.();
      } else if (prevAppState === 'active' && nextAppState.match(/inactive|background/)) {
        onBackgroundRef.current?.();
      }
      appStateRef.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Following if-else logic is to support RN >= 0.65 and RN < 0.65 versions.
      // https://github.com/react-native-community/releases/blob/master/CHANGELOG.md#:~:text=EventEmitter%23removeSubscription%20is%20now%20deprecated.%20(cb6cbd12f8%20by%20%40yungsters)
      if (subscription?.remove) {
        subscription.remove();
      } else {
        AppState.removeEventListener('change', handleAppStateChange);
      }
    };
  }, []);
};
