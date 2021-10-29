import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkState(mountedState: { current: boolean }) {
  const [lastOnlineStatus, setLastOnlineStatus] = useState(Date.now());
  const networkState = useRef(true);

  useEffect(() => {
    NetInfo.addEventListener((state) => {
      if (mountedState.current) {
        if (state.isConnected && state.isInternetReachable) {
          if (networkState.current === false) {
            setLastOnlineStatus(Date.now());
          }
          networkState.current = true;
        } else {
          networkState.current = false;
        }
      }
    });
  }, []);

  return lastOnlineStatus;
}
