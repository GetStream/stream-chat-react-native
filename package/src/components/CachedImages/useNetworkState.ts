import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkState(mountedState: { current: boolean }) {
  const [hasNetwork, setHasNetwork] = useState(true);

  useEffect(() => {
    NetInfo.addEventListener((state) => {
      if (mountedState.current) {
        if (state.isConnected && state.isInternetReachable) {
          setHasNetwork(true);
        } else {
          setHasNetwork(false);
        }
      }
    });
  }, []);

  return hasNetwork;
}
