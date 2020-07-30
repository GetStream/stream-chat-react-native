import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export const useAppState = () => {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState !== nextAppState) {
        setAppState(nextAppState);
      }
    };

    AppState.addEventListener('change', handleAppStateChange);

    return () => AppState.removeEventListener('change', handleAppStateChange);
  }, [appState, setAppState]);

  return appState;
};
