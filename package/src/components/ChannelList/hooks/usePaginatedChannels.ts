import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Channel,
  ChannelFilters,
  ChannelManager,
  ChannelOptions,
  ChannelPaginator,
  ChannelPaginatorState,
  ChannelQueryShape,
  ChannelSort,
  PaginatorOptions,
} from 'stream-chat';

import { useActiveChannelsRefContext } from '../../../contexts/activeChannelsRefContext/ActiveChannelsRefContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks';
import { useLazyRef } from '../../../hooks/useLazyRef';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { generateRandomId } from '../../../utils/utils';

/**
 * Custom `queryChannels` implementation for a `ChannelList`. Mapped straight onto the paginator's
 * `doRequest`: it receives the request the paginator would have sent and must return the resolved
 * channels (call `client.queryChannels(...)` inside so client state stays in sync). It supersedes the
 * legacy `queryChannelsOverride` (which was typed as the now-removed `QueryChannelsRequestType`).
 */
export type ChannelListQueryChannelsOverride = PaginatorOptions<
  Channel,
  ChannelQueryShape
>['doRequest'];

type Parameters = {
  channelManager: ChannelManager;
  enableOfflineSupport: boolean;
  filters: ChannelFilters;
  options: ChannelOptions;
  sort: ChannelSort;
  lockChannelOrder?: boolean;
  queryChannelsOverride?: ChannelListQueryChannelsOverride;
};

const RETRY_INTERVAL_IN_MS = 5000;

type QueryType = 'reload' | 'refresh' | 'loadChannels' | 'backgroundRefresh';

const selector = (nextValue: ChannelPaginatorState) =>
  ({
    channels: nextValue.items,
    hasNextPage: nextValue.hasMoreTail,
    isLoading: nextValue.isLoading,
    lastQueryError: nextValue.lastQueryError,
  }) as const;

export const usePaginatedChannels = ({
  channelManager,
  enableOfflineSupport,
  filters = {},
  lockChannelOrder = false,
  options = {},
  queryChannelsOverride,
  sort = [],
}: Parameters) => {
  const [activeQueryType, setActiveQueryType] = useState<QueryType | null>(null);
  const activeChannels = useActiveChannelsRefContext();
  const { client } = useChatContext();

  /**
   * One `ChannelPaginator` per `<ChannelList>` instance, contributed to the shared `ChannelManager`.
   * The id is stable for the component's lifetime so the manager routes events to it and we can remove
   * it on unmount. Filters/sort/options are updated in place via setters when props change (the setters
   * do NOT reset the paginator, so the list is not blanked on a re-query — matching the legacy behavior).
   */
  const paginatorIdRef = useLazyRef(() => `channels:${generateRandomId()}`);
  const paginator = useMemo(() => {
    const existing = channelManager.getPaginatorById(paginatorIdRef.current);
    if (existing) {
      return existing as ChannelPaginator;
    }
    const { limit, offset: _offset, ...requestOptions } = options;
    return new ChannelPaginator({
      channelStateOptions: {
        skipInitialization: enableOfflineSupport ? undefined : activeChannels.current,
      },
      client,
      filters,
      id: paginatorIdRef.current,
      paginatorOptions: {
        doRequest: queryChannelsOverride,
        lockItemOrder: lockChannelOrder,
        ...(typeof limit === 'number' ? { pageSize: limit } : {}),
      },
      requestOptions,
      sort,
    });
    // Only (re)create when the manager or client identity changes. Prop changes are applied via
    // setters below; recreating would blank the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelManager, client]);

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

  /**
   * Insert the paginator into the shared manager on mount and remove it on unmount. `ChannelManager`
   * has no `removePaginator`, so removal is done through its public `StateStore` plus `dispose()` to
   * unlink the paginator from the shared item store (otherwise it lingers and keeps handling events).
   */
  useEffect(() => {
    channelManager.insertPaginator({ paginator });

    return () => {
      channelManager.state.partialNext({
        paginators: channelManager.paginators.filter((p) => p !== paginator),
      });
      paginator.dispose();
    };
  }, [channelManager, paginator]);

  const queryChannels = useStableCallback(
    async (queryType: QueryType = 'loadChannels'): Promise<void> => {
      if (!client || !isMountedRef.current) {
        return;
      }

      // Keep `skipInitialization` current for the online query (avoids clobbering the state of already
      // active channels on reconnect). Only relevant when offline support is disabled.
      paginator.channelStateOptions = {
        skipInitialization: enableOfflineSupport ? undefined : activeChannels.current,
      };

      setActiveQueryType(queryType);

      try {
        if (queryType === 'loadChannels') {
          // Next page — append toward the tail, keeping the current list.
          await paginator.toTail();
        } else if (queryType === 'reload') {
          // Initial load / filters-sort-options change — fresh first page (blanks to the skeleton).
          await paginator.reload();
        } else {
          // Pull-to-refresh / reconnect — first-page reset that REPLACES the list, but keeps the current
          // channels visible during the fetch (no skeleton flash). `reset: 'yes'` re-establishes the
          // window from page 1; `keepPreviousItems` keeps the list visible until the fresh page swaps in.
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
      // Only allow pull-to-refresh 5 seconds after the last successful refresh.
      if (now - lastRefresh.current < RETRY_INTERVAL_IN_MS && error === undefined) {
        return;
      }

      lastRefresh.current = Date.now();
      await queryChannels(isBackground ? 'backgroundRefresh' : 'refresh');
    },
  );

  const reloadList = useStableCallback(() => queryChannels('reload'));

  const loadNextPage = useStableCallback(() => queryChannels('loadChannels'));

  /**
   * Equality check using stringified filters/options/sort ensures we don't run unnecessary queries
   * when a parent re-render passes new object references with the same value.
   */
  const filterStr = useMemo(() => JSON.stringify(filters), [filters]);
  const optionsStr = useMemo(() => JSON.stringify(options), [options]);
  const sortStr = useMemo(() => JSON.stringify(sort), [sort]);

  useEffect(() => {
    // Sync the paginator config with the current props (setters don't reset state → no blank flash),
    // then reload with the new query shape.
    paginator.staticFilters = filters;
    paginator.sort = sort;
    const { limit, offset: _offset, ...requestOptions } = options;
    paginator.options = requestOptions;
    if (typeof limit === 'number') {
      paginator.pageSize = limit;
    }

    reloadList();

    const listener: ReturnType<typeof client.on> = client.on(
      'connection.changed',
      async (event) => {
        if (event.online) {
          // Reconnection refreshes stay silent but share the pull-to-refresh debounce path.
          await refreshList({ isBackground: true });
        }
      },
    );

    return () => listener?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStr, optionsStr, sortStr, paginator]);

  // Propagate runtime `lockChannelOrder` changes without a re-query (matches the legacy `setOptions`
  // effect). Only affects how subsequent event-driven ingests reorder the list.
  useEffect(() => {
    paginator.config.lockItemOrder = lockChannelOrder;
  }, [paginator, lockChannelOrder]);

  // Propagate a runtime `queryChannelsOverride` swap (matches the legacy `setQueryChannelsRequest`
  // effect). The next query picks it up; no immediate reload needed.
  useEffect(() => {
    paginator.config.doRequest = queryChannelsOverride;
  }, [paginator, queryChannelsOverride]);

  return {
    channelListInitialized,
    channels,
    error,
    hasNextPage,
    loadingChannels: channels === undefined && !error,
    loadingNextPage: activeQueryType === 'loadChannels' && !!isLoading,
    loadNextPage,
    refreshing: activeQueryType === 'refresh',
    refreshList: () => refreshList(),
    reloadList,
  };
};
