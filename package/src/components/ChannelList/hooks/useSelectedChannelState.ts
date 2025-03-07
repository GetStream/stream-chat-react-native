import { useCallback } from 'react';

import type { Channel, EventTypes } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

const noop = () => {};

export function useSelectedChannelState<O>(_: {
  channel: Channel;
  selector: (channel: Channel) => O;
  stateChangeEventKeys?: EventTypes[];
}): O;
export function useSelectedChannelState<O>(_: {
  selector: (channel: Channel) => O;
  channel?: Channel | undefined;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined;
export function useSelectedChannelState<O>({
  channel,
  selector,
  stateChangeEventKeys = ['all'],
}: {
  selector: (channel: Channel) => O;
  channel?: Channel;
  stateChangeEventKeys?: EventTypes[];
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
