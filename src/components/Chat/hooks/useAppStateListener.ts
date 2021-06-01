import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppStateListener = (onForeground?: () => void, onBackground?: () => void) => {
  const [appState, setAppState] = useState(AppState.currentState);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState === 'background' && nextAppState === 'active' && onForeground) {
      onForeground();
    } else if (appState.match(/active|inactive/) && nextAppState === 'background' && onBackground) {
      onBackground();
    }
    setAppState(nextAppState);
  };

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);

    return () => AppState.removeEventListener('change', handleAppStateChange);
  }, [handleAppStateChange]);
};
