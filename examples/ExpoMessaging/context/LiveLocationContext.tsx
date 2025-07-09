import React, { createContext, useContext, useMemo } from 'react';
import { useChatContext } from 'stream-chat-expo';
import * as Location from 'expo-location';

interface LiveLocationContextValue {
  startLiveLocation: (id: string) => Promise<void>;
  stopLiveLocation: (id: string) => Promise<void>;
  isWatching: (id: string) => boolean;
}

const LiveLocationContext = createContext<LiveLocationContextValue>({
  startLiveLocation: () => Promise.resolve(),
  stopLiveLocation: () => Promise.resolve(),
  isWatching: () => false,
});

export const useLiveLocationContext = () => {
  return useContext(LiveLocationContext);
};

// a map of message IDs to live location watch subscriptions
const messageIdToLiveWatchMap = new Map<string, Location.LocationSubscription>();

const isWatching = (id: string) => {
  return messageIdToLiveWatchMap.has(id);
};

export const LiveLocationContextProvider = (props: React.PropsWithChildren<{}>) => {
  const { client } = useChatContext();

  const lastLocationRef = React.useRef<Location.LocationObject | null>(null);

  const startLiveLocation = React.useCallback(
    async (id: string) => {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 0,
          // Android only: these option are ignored on iOS
          timeInterval: 5000,
        },
        (position) => {
          client.updateMessage({
            id,
            attachments: [
              {
                type: 'location',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            ],
          });
          lastLocationRef.current = position;
        },
        (error) => {
          console.error('watchPosition', error);
        },
      );
      messageIdToLiveWatchMap.set(id, subscription);
    },
    [client],
  );

  const stopLiveLocation = React.useCallback(
    async (id: string) => {
      const subscription = messageIdToLiveWatchMap.get(id);
      if (subscription !== undefined) {
        subscription.remove();
        messageIdToLiveWatchMap.delete(id);

        if (lastLocationRef.current) {
          await client.updateMessage({
            id,
            attachments: [
              {
                type: 'location',
                latitude: lastLocationRef.current.coords.latitude,
                longitude: lastLocationRef.current.coords.longitude,
                ended_at: new Date(lastLocationRef.current.timestamp).toISOString(),
              },
            ],
          });
        }
      }
    },
    [client],
  );

  const contextValue: LiveLocationContextValue = useMemo(
    () => ({
      startLiveLocation,
      stopLiveLocation,
      isWatching,
    }),
    [startLiveLocation, stopLiveLocation, isWatching],
  );

  return (
    <LiveLocationContext.Provider value={contextValue}>
      {props.children}
    </LiveLocationContext.Provider>
  );
};
