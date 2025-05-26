import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  ChannelFilters,
  ChannelManager,
  ChannelManagerState,
  ChannelOptions,
  ChannelSort,
} from 'stream-chat';

import { useActiveChannelsRefContext } from '../../../contexts/activeChannelsRefContext/ActiveChannelsRefContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks';
import { useIsMountedRef } from '../../../hooks/useIsMountedRef';

import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

type Parameters = {
  channelManager: ChannelManager;
  enableOfflineSupport: boolean;
  filters: ChannelFilters;
  options: ChannelOptions;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
  sort: ChannelSort;
};

const DEFAULT_OPTIONS = {
  message_limit: 10,
};

const RETRY_INTERVAL_IN_MS = 5000;

type QueryType = 'queryLocalDB' | 'reload' | 'refresh' | 'loadChannels';

export type QueryChannels = (queryType?: QueryType, retryCount?: number) => Promise<void>;

const selector = (nextValue: ChannelManagerState) =>
  ({
    channelListInitialized: nextValue.initialized,
    channels: nextValue.channels,
    error: nextValue.error,
    pagination: nextValue.pagination,
  }) as const;

export const usePaginatedChannels = ({
  channelManager,
  enableOfflineSupport,
  filters = {},
  options = DEFAULT_OPTIONS,
  sort = {},
}: Parameters) => {
  const [staticChannelsActive, setStaticChannelsActive] = useState<boolean>(false);
  const [activeQueryType, setActiveQueryType] = useState<QueryType | null>('queryLocalDB');
  const activeChannels = useActiveChannelsRefContext();
  const isMountedRef = useIsMountedRef();
  const { client } = useChatContext();
  const { channelListInitialized, channels, pagination, error } =
    useStateStore(channelManager?.state, selector) ?? {};
  const hasNextPage = pagination?.hasNext;

  const filtersRef = useRef<typeof filters | null>(null);
  const sortRef = useRef<typeof sort | null>(null);
  const activeRequestId = useRef<number>(0);
  const isQueryingRef = useRef(false);
  const lastRefresh = useRef(Date.now());

  const queryChannels: QueryChannels = async (
    queryType: QueryType = 'loadChannels',
  ): Promise<void> => {
    if (!client || !isMountedRef.current) {
      return;
    }

    const hasUpdatedData =
      queryType === 'loadChannels' ||
      queryType === 'refresh' ||
      [
        JSON.stringify(filtersRef.current) !== JSON.stringify(filters),
        JSON.stringify(sortRef.current) !== JSON.stringify(sort),
      ].some(Boolean);

    const isQueryStale = () => !isMountedRef || activeRequestId.current !== currentRequestId;

    /**
     * We don't need to make another call to query channels if we don't
     * have new data for the query to include
     * */
    if (!hasUpdatedData) {
      if (activeQueryType === null) {
        return;
      }
    }

    filtersRef.current = filters;
    sortRef.current = sort;
    isQueryingRef.current = true;
    activeRequestId.current++;
    const currentRequestId = activeRequestId.current;
    setActiveQueryType(queryType);

    const newOptions = {
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
      offset: 0,
      ...options,
    };

    try {
      if (isQueryStale() || !isMountedRef.current) {
        return;
      }
      /**
       * We skipInitialization here for handling race condition between ChannelList, Channel (and Thread)
       * when they all (may) update the channel state at the same time (when connection state recovers)
       * TODO: if we move the channel state to a single context and share it between ChannelList, Channel and Thread we can remove this
       */
      if (queryType === 'loadChannels') {
        await channelManager.loadNext();
      } else {
        await channelManager.queryChannels(filters, sort, newOptions, {
          skipInitialization: enableOfflineSupport ? undefined : activeChannels.current,
        });
      }

      setStaticChannelsActive(false);
      isQueryingRef.current = false;
    } catch (err: unknown) {
      isQueryingRef.current = false;

      if (isQueryStale()) {
        return;
      }

      console.warn(err);
    }

    setActiveQueryType(null);
  };

  const refreshList = async () => {
    const now = Date.now();
    // Only allow pull-to-refresh 5 seconds after last successful refresh.
    if (now - lastRefresh.current < RETRY_INTERVAL_IN_MS && error === undefined) {
      return;
    }

    lastRefresh.current = Date.now();
    await queryChannels('refresh');
  };

  const reloadList = async () => {
    await queryChannels('reload');
  };

  /**
   * Equality check using stringified filters/sort ensure that we don't make un-necessary queryChannels api calls
   * for the scenario:
   *
   * <ChannelList
   *    filters={{
   *      members: { $in: ['vishal'] }
   *    }}
   *    ...
   * />
   *
   * Here we have passed filters as inline object, which means on every re-render of
   * parent component, ChannelList will receive new object reference (even though value is same), which
   * in return will trigger useEffect. To avoid this, we can add a value check.
   */
  const filterStr = useMemo(() => JSON.stringify(filters), [filters]);
  const sortStr = useMemo(() => JSON.stringify(sort), [sort]);

  useEffect(() => {
    const listener: ReturnType<typeof client.on> = client.on(
      'connection.changed',
      async (event) => {
        if (event.online) {
          await refreshList();
        }
      },
    );
    reloadList();

    return () => listener?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStr, sortStr, channelManager]);

  return {
    channelListInitialized,
    channels,
    error,
    hasNextPage,
    loadingChannels:
      activeQueryType === 'queryLocalDB'
        ? true
        : // Although channels.length === 0 should come as a given when we have !channelListInitialized,
          // due to the way offline storage works currently we have to do this additional
          // check to make sure channels were not populated before the reactive list becomes
          // ready. I do not like providing a way to set the ready state, as it should be managed
          // in the LLC entirely. Once we move offline support to the LLC, we can remove this check
          // too as it'll be redundant.
          pagination?.isLoading || (!channelListInitialized && channels.length === 0 && !error),
    loadingNextPage: pagination?.isLoadingNext,
    loadNextPage: channelManager.loadNext,
    refreshing: activeQueryType === 'refresh',
    refreshList,
    reloadList,
    staticChannelsActive,
  };
};
