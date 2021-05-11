import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppStateListener = (
  onForeground?: () => void,
  onBackground?: () => void,
) => {
  const appState = useRef(AppState.currentState);
  const listenerExists = onForeground || onBackground;

  useEffect(() => {
    listenerExists && AppState.addEventListener('change', handleAppStateChange);

    return () => {
      listenerExists &&
        AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === 'background' && nextAppState === 'active') {
      onForeground?.();
    } else if (
      appState.current.match(/active|inactive/) &&
      nextAppState === 'background'
    ) {
      onBackground?.();
    }
    appState.current = nextAppState;
  };
};
