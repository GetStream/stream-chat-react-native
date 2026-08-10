import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelPaginator,
  ChannelPaginatorState,
  ChannelQueryShape,
  ChannelSort,
  PaginatorOptions,
} from 'stream-chat';

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
  filters = {},
  lockChannelOrder = false,
  options = {},
  queryChannelsOverride,
  sort = [],
}: Parameters) => {
  const [activeQueryType, setActiveQueryType] = useState<QueryType | null>(null);
  const { client } = useChatContext();
  const channelManager = client.channelManager;

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
        skipInitialization: undefined,
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
   * Insert the paginator into the shared manager on mount and remove it on unmount. `removePaginator`
   * detaches it from the manager (restores its own query filtering and cancels any scheduled query);
   * `dispose()` then releases the paginator's own throttles and index so it stops handling events.
   */
  useEffect(() => {
    channelManager.insertPaginator({ paginator });

    return () => {
      // TODO: Figure out if we really want to dispose of paginators. Why would we want to create a new
      //       paginator each time this mounts and then dispose it ? Perhaps a better way is to keep the
      //       state stable and perhaps only dispose on user disconnect or something like that.
      channelManager.removePaginator(paginator);
      paginator.dispose();
    };
  }, [channelManager, paginator]);

  const queryChannels = useStableCallback(
    async (queryType: QueryType = 'loadChannels'): Promise<void> => {
      if (!client || !isMountedRef.current) {
        return;
      }

      // Do NOT skip state initialization on the (re)query. `activeChannels.current` is
      // `Object.keys(channelsState)` — every channel ever MOUNTED, and it is never cleared on
      // navigate-back — so passing it as `skipInitialization` made `hydrateActiveChannels` skip
      // `seedFirstPageSync`/`_initializeState` for every previously-opened channel on each reconnect.
      // Those channels' `messagePaginator.aggregateState` then never re-seeds on the fresh socket, so
      // their list-row preview (last message / unread, sourced from that aggregate) freezes while the
      // list still reorders. Re-initializing matches the offline-enabled path; the client still guards a
      // scrolled-up open channel from being clobbered via the `isActiveIntervalAtHead` check.
      paginator.channelStateOptions = {
        skipInitialization: undefined,
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
    async ({
      force = false,
      isBackground = false,
    }: { force?: boolean; isBackground?: boolean } = {}) => {
      const now = Date.now();
      // Only allow pull-to-refresh 5 seconds after the last successful refresh. A reconnect (`force`)
      // must bypass this throttle: it is the sole trigger that re-establishes channel watches after the
      // socket reopens (the JS client's own recovery is disabled via `recoverStateOnReconnect = false`),
      // so debouncing it leaves the channels un-watched — the list still reorders on member-level
      // `notification.message_new`, but per-channel state (last message / unread) stays frozen until the
      // next reconnect > 5s later or an app reload. This bites both a reconnect < 5s after launch
      // (`lastRefresh` is seeded to mount time) and two reconnects < 5s apart.
      if (!force && now - lastRefresh.current < RETRY_INTERVAL_IN_MS && error === undefined) {
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
          // Reconnection refreshes stay silent (`isBackground`) but must NOT be throttled by the
          // pull-to-refresh debounce (`force`) — this is the query that re-watches the channels on the
          // fresh socket. See the `force` note in `refreshList`.
          await refreshList({ force: true, isBackground: true });
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
