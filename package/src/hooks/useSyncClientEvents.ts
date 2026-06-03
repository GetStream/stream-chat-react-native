import { useCallback } from 'react';

import type { Channel, EventTypes, StreamChat } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

const noop = () => {};

export function useSyncClientEventsToChannel<O>(_: {
  channel: Channel;
  client: StreamChat;
  selector: (channel: Channel, client: StreamChat) => O;
  stateChangeEventKeys?: EventTypes[];
}): O;
export function useSyncClientEventsToChannel<O>(_: {
  selector: (channel: Channel, client: StreamChat) => O;
  channel?: Channel | undefined;
  client?: StreamChat | undefined;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined;
export function useSyncClientEventsToChannel<O>({
  channel,
  client,
  selector,
  stateChangeEventKeys = ['all'],
}: {
  selector: (channel: Channel, client: StreamChat) => O;
  channel?: Channel | undefined;
  client?: StreamChat;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined {
  const subscribe = useCallback(
    (onStoreChange: (value: O) => void) => {
      if (!client || !channel) {
        return noop;
      }

      const subscriptions = stateChangeEventKeys.map((et) =>
        client.on(et, () => {
          onStoreChange(selector(channel, client));
        }),
      );

      return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    },
    [channel, client, selector, stateChangeEventKeys],
  );

  const getSnapshot = useCallback(() => {
    if (!client || !channel) {
      return undefined;
    }

    const originalSnapshot = selector(channel, client);
    return originalSnapshot;
  }, [channel, client, selector]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useSyncClientEvents<O>(_: {
  client: StreamChat;
  selector: (client: StreamChat) => O;
  stateChangeEventKeys: EventTypes[];
}): O;
export function useSyncClientEvents<O>(_: {
  client?: StreamChat | undefined;
  selector: (client: StreamChat) => O;
  stateChangeEventKeys: EventTypes[];
}): O | undefined;
export function useSyncClientEvents<O>({
  client,
  selector,
  stateChangeEventKeys = ['all'],
}: {
  selector: (client: StreamChat) => O;
  client?: StreamChat;
  stateChangeEventKeys: EventTypes[];
}): O | undefined {
  const subscribe = useCallback(
    (onStoreChange: (value: O) => void) => {
      if (!client) {
        return noop;
      }

      const subscriptions = stateChangeEventKeys.map((et) =>
        client.on(et, () => {
          onStoreChange(selector(client));
        }),
      );

      return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    },
    [client, selector, stateChangeEventKeys],
  );

  const getSnapshot = useCallback(() => {
    if (!client) {
      return undefined;
    }

    return selector(client);
  }, [client, selector]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
