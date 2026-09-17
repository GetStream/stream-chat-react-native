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

const maxLoadedItemsSelector = (state: { maxLoadedItems?: number }) => ({
  maxLoadedItems: state.maxLoadedItems,
});

/**
 * Drives the message list's window cap.
 *
 * The cap itself lives in `stream-chat` — configure it with
 * `channel.messagePaginator.updateConfig({ maxLoadedItems })`, or declaratively via
 * `client.config.set({ channel: { messagePaginator: { maxLoadedItems } } })`. The paginator drops the
 * oldest messages as new ones arrive and re-opens its "load older" edge, so scrolling back re-fetches.
 *
 * What this hook owns is the one part the state layer cannot know: **whether pruning is safe right
 * now**. Dropping the oldest messages while the user is reading near them would pull content out from
 * under them, so viewability is tracked here and pushed down as a single boolean. The paginator reads
 * it on ingest; nothing subscribes to it, so scrolling can never cost a render.
 */
export function usePrunableMessageList({ paginator }: { paginator?: MessagePaginator }) {
  // Track visible index range (index in the rendered list)
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

  /**
   * The paginator outlives this list, so a suspension must not outlive it either — leaving it set
   * would keep the window growing unbounded long after the user navigated away.
   */
  useEffect(() => () => paginator?.setPruningSuspended(false), [paginator]);

  return { maxLoadedItems, viewabilityChangedCallback };
}
