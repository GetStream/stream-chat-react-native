import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppStateListener = (onForeground?: () => void, onBackground?: () => void) => {
  const [appState, setAppState] = useState(AppState.currentState);
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (appState === 'background' && nextAppState === 'active' && onForeground) {
        onForeground();
      } else if (
        appState.match(/active|inactive/) &&
        nextAppState === 'background' &&
        onBackground
      ) {
        onBackground();
      }
      setAppState(nextAppState);
    },
    [onBackground, onForeground, appState],
  );

  useEffect(() => {
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
  }, [handleAppStateChange]);
};
