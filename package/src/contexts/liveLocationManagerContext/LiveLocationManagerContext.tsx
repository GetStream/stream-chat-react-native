import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { Platform } from 'react-native';

import { LiveLocationManager, WatchLocation } from 'stream-chat';

import { useChatContext } from '../chatContext/ChatContext';

interface LiveLocationManagerContextValue {
  liveLocationManager: LiveLocationManager | null;
}

const LiveLocationManagerContext = createContext<LiveLocationManagerContextValue>({
  liveLocationManager: null,
});

export const useLiveLocationManagerContext = () => {
  return useContext(LiveLocationManagerContext);
};

export type LiveLocationManagerProviderProps = {
  watchLocation: WatchLocation;
  getDeviceId?: () => string;
};

export const LiveLocationManagerProvider = (
  props: React.PropsWithChildren<LiveLocationManagerProviderProps>,
) => {
  const { client } = useChatContext();
  const { watchLocation, getDeviceId, children } = props;

  const liveLocationManager = useMemo(() => {
    if (!client) {
      return null;
    }
    // Create a new instance of LiveLocationManager with the client and utility functions
    return new LiveLocationManager({
      client,
      getDeviceId: getDeviceId ?? (() => `react-native-${Platform.OS}-${client.userID}`),
      watchLocation,
    });
  }, [client, getDeviceId, watchLocation]);

  useEffect(() => {
    if (!liveLocationManager) {
      return;
    }
    // Initialize the live location manager
    liveLocationManager.init();

    return () => {
      liveLocationManager.unregisterSubscriptions();
    };
  }, [liveLocationManager]);

  return (
    <LiveLocationManagerContext.Provider value={{ liveLocationManager }}>
      {children}
    </LiveLocationManagerContext.Provider>
  );
};
