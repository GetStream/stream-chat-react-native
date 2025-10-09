import { useRef } from 'react';

import { ViewToken } from 'react-native';

import { Channel } from 'stream-chat';

import { useStableCallback } from './useStableCallback';

import { ChannelPropsWithContext } from '../components';

export type VisibleRangeConfig = { first: number; last: number; inverted: boolean };
export type ViewabilityChangedCallbackInput = {
  viewableItems: ViewToken[] | undefined;
  inverted: boolean;
};

// The number of messages from an edge we want to be viewing before we stop pruning
const calculateSafeGap = (maximumMessages: number) => 0.2 * maximumMessages;

const isNearEnd = ({
  rangeConfig,
  maximumMessageLimit,
}: {
  rangeConfig: VisibleRangeConfig;
  maximumMessageLimit: number;
}) => {
  const { first, last, inverted } = rangeConfig;

  const safeGap = calculateSafeGap(maximumMessageLimit);

  if (!inverted) return first <= safeGap;

  return last >= maximumMessageLimit - 1 - safeGap;
};

export function usePrunableMessageList({
  // setter to update the array used by the List
  setMessages: rawSetMessages,
  maximumMessageLimit,
}: {
  setMessages: (channel: Channel) => void;
} & Pick<ChannelPropsWithContext, 'maximumMessageLimit'>) {
  // Track visible index range (index in `channel.messages`)
  const visibleRangeConfigRef = useRef<VisibleRangeConfig>({ first: 0, inverted: true, last: -1 });

  const viewabilityChangedCallback = useStableCallback(
    ({ viewableItems, inverted = true }: ViewabilityChangedCallbackInput) => {
      if (!viewableItems?.length || maximumMessageLimit == null) return;
      let first = Infinity;
      let last = -1;
      for (const v of viewableItems) {
        if (v.index == null) continue;
        if (v.index < first) first = v.index;
        if (v.index > last) last = v.index;
      }
      if (first !== Infinity) visibleRangeConfigRef.current = { first, inverted, last };
    },
  );

  // Prune when length exceeds MAX, but only if the viewport is far from the back edge
  const setMessages = useStableCallback((channel: Channel) => {
    const rangeConfig = visibleRangeConfigRef.current;

    if (
      maximumMessageLimit == null ||
      channel.state.messages.length <= maximumMessageLimit ||
      isNearEnd({ maximumMessageLimit, rangeConfig })
    ) {
      rawSetMessages(channel);
      return;
    }

    channel.state.pruneFromEnd(maximumMessageLimit);

    rawSetMessages(channel);
  });

  return { setMessages, viewabilityChangedCallback };
}
