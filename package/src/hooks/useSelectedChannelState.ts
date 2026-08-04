import { useCallback } from 'react';

import type { Channel, EventType } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

const noop = () => {};

export function useSelectedChannelState<O>(_: {
  channel: Channel;
  selector: (channel: Channel) => O;
  stateChangeEventKeys?: EventType[];
}): O;
export function useSelectedChannelState<O>(_: {
  selector: (channel: Channel) => O;
  channel?: Channel | undefined;
  stateChangeEventKeys?: EventType[];
}): O | undefined;
export function useSelectedChannelState<O>({
  channel,
  selector,
  stateChangeEventKeys = ['all'],
}: {
  selector: (channel: Channel) => O;
  channel?: Channel;
  stateChangeEventKeys?: EventType[];
}): O | undefined {
  const subscribe = useCallback(
    (onStoreChange: (value: O) => void) => {
      if (!channel) {
        return noop;
      }

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
    if (!channel) {
      return undefined;
    }

    return selector(channel);
  }, [channel, selector]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
