import { useEffect, useRef } from 'react';

import type { MessagePaginator } from 'stream-chat';

import { useStableCallback } from './useStableCallback';
import { useStateStore } from './useStateStore';

import type { ViewToken } from '../types/react-native-compat';

export type VisibleRangeConfig = { first: number; last: number; inverted: boolean };
export type ViewabilityChangedCallbackInput = {
  viewableItems: ViewToken[] | undefined;
  inverted: boolean;
};

// Distance in messages from an edge within which pruning is suspended: 20% of the cap.
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

const maxLoadedItemsSelector = (state: { maxLoadedItems?: number }) => ({
  maxLoadedItems: state.maxLoadedItems,
});

/**
 * Tells the paginator when the message list may prune its oldest messages.
 *
 * The cap (`maxLoadedItems`) lives in `stream-chat`: set it with
 * `channel.messagePaginator.updateConfig({ maxLoadedItems })` or
 * `client.config.set({ channel: { messagePaginator: { maxLoadedItems } } })`. This hook owns
 * whether pruning is safe: it tracks the visible range and suspends pruning while the user is near
 * the pruned edge. The paginator reads that boolean on ingest and nothing subscribes to it, so
 * scrolling costs no render.
 *
 * @param params.paginator The message paginator of the list.
 * @returns The `maxLoadedItems` cap and the `viewabilityChangedCallback` to wire to the list.
 */
export function usePrunableMessageList({ paginator }: { paginator?: MessagePaginator }) {
  const visibleRangeConfigRef = useRef<VisibleRangeConfig>({ first: 0, inverted: true, last: -1 });

  const { maxLoadedItems } = useStateStore(paginator?.configState, maxLoadedItemsSelector) ?? {};

  const viewabilityChangedCallback = useStableCallback(
    ({ viewableItems, inverted = true }: ViewabilityChangedCallbackInput) => {
      if (!viewableItems?.length || !maxLoadedItems) return;
      let first = Infinity;
      let last = -1;
      for (const v of viewableItems) {
        if (v.index == null) continue;
        if (v.index < first) first = v.index;
        if (v.index > last) last = v.index;
      }
      if (first === Infinity) return;
      const rangeConfig = { first, inverted, last };
      visibleRangeConfigRef.current = rangeConfig;
      paginator?.setPruningSuspended(
        isNearEnd({ maximumMessageLimit: maxLoadedItems, rangeConfig }),
      );
    },
  );

  // The paginator outlives this list, so a suspension must not: left set, the window would grow
  // unbounded after the user navigated away.
  useEffect(() => () => paginator?.setPruningSuspended(false), [paginator]);

  return { maxLoadedItems, viewabilityChangedCallback };
}
