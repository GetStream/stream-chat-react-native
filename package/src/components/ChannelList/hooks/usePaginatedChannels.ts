import { useEffect, useRef, useState } from 'react';

import type { ChannelPaginator, ChannelPaginatorState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { useClientUserId } from '../../Chat/hooks/useClientUserId';

const RETRY_INTERVAL_IN_MS = 5000;

type QueryType = 'reload' | 'refresh' | 'loadChannels' | 'backgroundRefresh';

const selector = (nextValue: ChannelPaginatorState) =>
  ({
    channels: nextValue.items,
    hasNextPage: nextValue.hasMoreTail,
    isLoading: nextValue.isLoading,
    lastQueryError: nextValue.lastQueryError,
  }) as const;

export const usePaginatedChannels = ({ paginator }: { paginator: ChannelPaginator }) => {
  const [activeQueryType, setActiveQueryType] = useState<QueryType | null>(null);
  const { client } = useChatContext();

  const { channels, hasNextPage, isLoading, lastQueryError } =
    useStateStore(paginator.state, selector) ?? {};

  const channelListInitialized = channels !== undefined;
  const error = lastQueryError;

  const isMountedRef = useRef(true);
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const queryChannels = useStableCallback(
    async (queryType: QueryType = 'loadChannels'): Promise<void> => {
      if (!client || !isMountedRef.current) {
        return;
      }

      setActiveQueryType(queryType);

      try {
        if (queryType === 'loadChannels') {
          // Next page — append toward the tail, keeping the current list.
          await paginator.toTail();
        } else if (queryType === 'reload') {
          // First page from scratch (blanks to the skeleton).
          await paginator.reload();
        } else {
          await paginator.toTail({ keepPreviousItems: true, reset: 'yes' });
        }
      } catch (err: unknown) {
        console.warn(err);
      }

      if (isMountedRef.current) {
        setActiveQueryType(null);
      }
    },
  );

  const refreshList = useStableCallback(
    async ({ isBackground = false }: { isBackground?: boolean } = {}) => {
      const now = Date.now();
      // Only allow pull-to-refresh 5 seconds after the last successful refresh. This throttle is now
      // purely about the user pulling repeatedly: reconnect refreshes no longer come through here at
      // all — `client.connectionRecovery` owns them and re-runs each list's own query directly on the
      // paginator, so they can never be swallowed by this window.
      if (now - lastRefresh.current < RETRY_INTERVAL_IN_MS && error === undefined) {
        return;
      }

      lastRefresh.current = Date.now();
      await queryChannels(isBackground ? 'backgroundRefresh' : 'refresh');
    },
  );

  const reloadList = useStableCallback(() => queryChannels('reload'));

  const refreshListWithDefaults = useStableCallback(() => refreshList());

  const loadNextPage = useStableCallback(async () => {
    if (!paginator.isInitialized) return;
    await queryChannels('loadChannels');
  });

  // Load the first page whenever the paginator has none: on the first mount, after the app swaps in a
  // new paginator, and after `client.disconnectUser` resets it. A paginator that already has channels
  // is shown as is, and a load already in flight is left alone.
  const userId = useClientUserId(client);
  const isUnloaded = channels === undefined;
  useEffect(() => {
    if (!isUnloaded || !userId || paginator.isLoading) return;
    reloadList();
  }, [isUnloaded, paginator, reloadList, userId]);

  return {
    channelListInitialized,
    channels,
    error,
    hasNextPage,
    loadingChannels: channels === undefined && !error,
    loadingNextPage: activeQueryType === 'loadChannels' && !!isLoading,
    loadNextPage,
    refreshing: activeQueryType === 'refresh',
    refreshList: refreshListWithDefaults,
    reloadList,
  };
};
