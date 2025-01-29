import { useCallback } from 'react';

import type { Channel, EventTypes } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { DefaultStreamChatGenerics } from '../../../types/types';

const noop = () => {};

export function useSelectedChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics,
  O,
>(_: {
  channel: Channel<StreamChatGenerics>;
  selector: (channel: Channel<StreamChatGenerics>) => O;
  stateChangeEventKeys?: EventTypes[];
}): O;
export function useSelectedChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics,
  O,
>(_: {
  selector: (channel: Channel<StreamChatGenerics>) => O;
  channel?: Channel<StreamChatGenerics> | undefined;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined;
export function useSelectedChannelState<StreamChatGenerics extends DefaultStreamChatGenerics, O>({
  channel,
  selector,
  stateChangeEventKeys = ['all'],
}: {
  selector: (channel: Channel<StreamChatGenerics>) => O;
  channel?: Channel<StreamChatGenerics>;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined {
  const subscribe = useCallback(
    (onStoreChange: (value: O) => void) => {
      if (!channel) return noop;

      const subscriptions = stateChangeEventKeys.map((et) =>
        channel.on(et, () => {
          onStoreChange(selector(channel));
        }),
      );

      return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    },
    [channel, selector, stateChangeEventKeys],
  );

  const getSnapshot = useCallback(() => {
    if (!channel) return undefined;

    return selector(channel);
  }, [channel, selector]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
