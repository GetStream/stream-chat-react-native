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
          // Next page, appended toward the tail.
          await paginator.toTail();
        } else if (queryType === 'reload') {
          // First page from scratch, which blanks the list to the skeleton.
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
      // Throttles repeated pull-to-refresh to one per interval, unless the last query failed.
      // Reconnect refreshes do not pass through here: `client.connectionRecovery` re-runs the
      // paginator's query itself.
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

  // Loads the first page whenever the paginator has none: on first mount, when the app swaps in a
  // new paginator, and after `client.disconnectUser` resets it. A paginator that already has
  // channels is shown as is, and a load in flight is left alone.
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
