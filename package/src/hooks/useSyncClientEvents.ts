import { useCallback } from 'react';

import type { Channel, EventTypes, StreamChat } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { DefaultStreamChatGenerics } from '../types/types';

const noop = () => {};

export function useSyncClientEventsToChannel<
  StreamChatGenerics extends DefaultStreamChatGenerics,
  O,
>(_: {
  channel: Channel<StreamChatGenerics>;
  client: StreamChat<StreamChatGenerics>;
  selector: (channel: Channel<StreamChatGenerics>, client: StreamChat<StreamChatGenerics>) => O;
  stateChangeEventKeys?: EventTypes[];
}): O;
export function useSyncClientEventsToChannel<
  StreamChatGenerics extends DefaultStreamChatGenerics,
  O,
>(_: {
  selector: (channel: Channel<StreamChatGenerics>, client: StreamChat<StreamChatGenerics>) => O;
  channel?: Channel<StreamChatGenerics> | undefined;
  client?: StreamChat<StreamChatGenerics> | undefined;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined;
export function useSyncClientEventsToChannel<
  StreamChatGenerics extends DefaultStreamChatGenerics,
  O,
>({
  channel,
  client,
  selector,
  stateChangeEventKeys = ['all'],
}: {
  selector: (channel: Channel<StreamChatGenerics>, client: StreamChat<StreamChatGenerics>) => O;
  channel?: Channel<StreamChatGenerics> | undefined;
  client?: StreamChat<StreamChatGenerics>;
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
