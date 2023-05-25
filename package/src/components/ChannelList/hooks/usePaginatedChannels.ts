import { useEffect, useMemo, useRef, useState } from 'react';

import type { Channel, ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';

import { useActiveChannelsRefContext } from '../../../contexts/activeChannelsRefContext/ActiveChannelsRefContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useIsMountedRef } from '../../../hooks/useIsMountedRef';

import { getChannelsForFilterSort } from '../../../store/apis/getChannelsForFilterSort';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { ONE_SECOND_IN_MS } from '../../../utils/date';
import { DBSyncManager } from '../../../utils/DBSyncManager';
import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

const waitSeconds = (seconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, seconds * ONE_SECOND_IN_MS);
  });

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    enableOfflineSupport: boolean;
    filters: ChannelFilters<StreamChatGenerics>;
    options: ChannelOptions;
    setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
    sort: ChannelSort<StreamChatGenerics>;
  };

const DEFAULT_OPTIONS = {
  message_limit: 10,
};

const MAX_NUMBER_OF_RETRIES = 3;
const RETRY_INTERVAL_IN_MS = 5000;

type QueryType = 'queryLocalDB' | 'reload' | 'refresh' | 'loadChannels';

export type QueryChannels = (queryType?: QueryType, retryCount?: number) => Promise<void>;

export const usePaginatedChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  enableOfflineSupport,
  filters = {},
  options = DEFAULT_OPTIONS,
  setForceUpdate,
  sort = {},
}: Parameters<StreamChatGenerics>) => {
  const [channels, setChannels] = useState<Channel<StreamChatGenerics>[] | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [staticChannelsActive, setStaticChannelsActive] = useState<boolean>(false);
  const [activeQueryType, setActiveQueryType] = useState<QueryType | null>('queryLocalDB');
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const activeChannels = useActiveChannelsRefContext();
  const isMountedRef = useIsMountedRef();
  const { client } = useChatContext<StreamChatGenerics>();

  const filtersRef = useRef<typeof filters | null>(null);
  const sortRef = useRef<typeof sort | null>(null);
  const activeRequestId = useRef<number>(0);
  const isQueryingRef = useRef(false);
  const lastRefresh = useRef(Date.now());

  const queryChannels: QueryChannels = async (
    queryType: QueryType = 'loadChannels',
    retryCount = 0,
  ): Promise<void> => {
    if (!client || !isMountedRef.current) return;

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
      if (activeQueryType === null) return;
    }

    filtersRef.current = filters;
    sortRef.current = sort;
    isQueryingRef.current = true;
    setError(undefined);
    activeRequestId.current++;
    const currentRequestId = activeRequestId.current;
    setActiveQueryType(queryType);

    const newOptions = {
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
      offset:
        queryType === 'loadChannels' && !staticChannelsActive && channels ? channels.length : 0,
      ...options,
    };

    try {
      /**
       * We skipInitialization here for handling race condition between ChannelList, Channel (and Thread)
       * when they all (may) update the channel state at the same time (when connection state recovers)
       * TODO: if we move the channel state to a single context and share it between ChannelList, Channel and Thread we can remove this
       */
      const channelQueryResponse = await client.queryChannels(filters, sort, newOptions, {
        skipInitialization: enableOfflineSupport ? undefined : activeChannels.current,
      });
      if (isQueryStale() || !isMountedRef.current) {
        return;
      }

      const newChannels =
        queryType === 'loadChannels' && !staticChannelsActive && channels
          ? [...channels, ...channelQueryResponse]
          : channelQueryResponse.map((c) => {
              const existingChannel = client.activeChannels[c.cid];
              if (existingChannel) {
                return existingChannel;
              }

              return c;
            });

      setChannels(newChannels);
      setStaticChannelsActive(false);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      isQueryingRef.current = false;
    } catch (err: unknown) {
      isQueryingRef.current = false;
      await waitSeconds(2);

      if (isQueryStale()) {
        return;
      }

      // querying.current check is needed in order to make sure the next query call doesnt flick an error
      // state and then succeed (reconnect case)
      if (retryCount === MAX_NUMBER_OF_RETRIES && !isQueryingRef.current) {
        setActiveQueryType(null);
        console.warn(err);

        setError(
          new Error(
            `Maximum number of retries reached in queryChannels. Last error message is: ${err}`,
          ),
        );
        return;
      }

      return queryChannels(queryType, retryCount + 1);
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

  const reloadList = () => queryChannels('reload');

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
    const loadOfflineChannels = () => {
      if (!client?.user?.id) return;

      try {
        const channelsFromDB = getChannelsForFilterSort({
          currentUserId: client.user.id,
          filters,
          sort,
        });

        if (channelsFromDB) {
          const offlineChannels = client.hydrateActiveChannels(channelsFromDB, {
            offlineMode: true,
            skipInitialization: [], // passing empty array will clear out the existing messages from channel state, this removes the possibility of duplicate messages
          });

          setChannels(offlineChannels);
          setStaticChannelsActive(true);
        }
      } catch (e) {
        console.warn('Failed to get channels from database: ', e);
      }

      setActiveQueryType(null);
    };

    let listener: ReturnType<typeof DBSyncManager.onSyncStatusChange>;
    if (enableOfflineSupport) {
      // Any time DB is synced, we need to update the UI with local DB channels first,
      // and then call queryChannels to ensure any new channels are added to UI.
      listener = DBSyncManager.onSyncStatusChange((syncStatus) => {
        if (syncStatus) {
          loadOfflineChannels();
          reloadList();
        }
      });
      // On start, load the channels from local db.
      loadOfflineChannels();

      // If db is already synced (sync api and pending api calls), then
      // right away call queryChannels.
      const dbSyncStatus = DBSyncManager.getSyncStatus();
      if (dbSyncStatus) {
        reloadList();
      }
    } else {
      listener = client.on('connection.changed', async (event) => {
        if (event.online) {
          await refreshList();
          setForceUpdate((u) => u + 1);
        }
      });

      reloadList();
    }

    return () => listener?.unsubscribe?.();
  }, [filterStr, sortStr]);

  return {
    channels,
    error,
    hasNextPage,
    loadingChannels:
      activeQueryType === 'queryLocalDB'
        ? true
        : (activeQueryType === 'reload' || activeQueryType === null) && channels === null,
    loadingNextPage: activeQueryType === 'loadChannels',
    loadNextPage: queryChannels,
    refreshing: activeQueryType === 'refresh',
    refreshList,
    reloadList,
    // Although channels can be null, there is no practical case where channels will be null
    // when setChannels is used. setChannels is only recommended to be used for overriding
    // event handler. Thus instead of adding if check for channels === null, its better to
    // simply reassign types here.
    setChannels,
    staticChannelsActive,
  };
};
