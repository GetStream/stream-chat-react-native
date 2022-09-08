import { useEffect, useMemo, useRef, useState } from 'react';

import type { Channel, ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';

import { useActiveChannelsRefContext } from '../../../contexts/activeChannelsRefContext/ActiveChannelsRefContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useIsMountedRef } from '../../../hooks/useIsMountedRef';

import { getChannelsForFilterSort } from '../../../store/apis/getChannelsForFilterSort';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { ONE_SECOND_IN_MS } from '../../../utils/date';
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
  sort = {},
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const [channels, setChannels] = useState<Channel<StreamChatGenerics>[] | null>(null);
  const [staticChannelsActive, setStaticChannelsActive] = useState<boolean>(false);
  const activeChannels = useActiveChannelsRefContext();

  const [error, setError] = useState<Error>();
  const [hasNextPage, setHasNextPage] = useState(true);
  const lastRefresh = useRef(Date.now());
  const isQueryingRef = useRef(false);
  const [activeQueryType, setActiveQueryType] = useState<QueryType | null>('queryLocalDB');
  const isMountedRef = useIsMountedRef();
  const filtersRef = useRef<typeof filters | null>(null);
  const sortRef = useRef<typeof sort | null>(null);
  const activeRequestId = useRef<number>(0);

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
      const channelQueryResponse = await client.queryChannels(filters, sort, newOptions, {
        skipInitialization: activeChannels.current,
      });

      if (isQueryStale() || !isMountedRef.current) {
        return;
      }
      const newChannels =
        queryType === 'loadChannels' && !staticChannelsActive && channels
          ? [...channels, ...channelQueryResponse]
          : channelQueryResponse;

      setChannels(newChannels);
      setStaticChannelsActive(false);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      setError(undefined);
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

  const loadNextPage = hasNextPage ? queryChannels : undefined;

  const refreshList = () => {
    const now = Date.now();
    // Only allow pull-to-refresh 5 seconds after last successful refresh.
    if (now - lastRefresh.current < RETRY_INTERVAL_IN_MS && error === undefined) {
      return;
    }

    lastRefresh.current = Date.now();
    return queryChannels('refresh');
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
    const loadChannels = () => {
      if (!client?.user?.id) return;
      if (enableOfflineSupport) {
        try {
          const channelsFromDB = getChannelsForFilterSort({
            currentUserId: client.user.id,
            filters,
            sort,
          });

          if (channelsFromDB) {
            setChannels(
              client.hydrateActiveChannels(channelsFromDB, {
                offlineMode: true,
              }),
            );
            setStaticChannelsActive(true);
          }
        } catch (e) {
          console.warn('Failed to get channels from database: ', e);
        }
      }

      reloadList();
    };

    loadChannels();
  }, [filterStr, sortStr]);

  return {
    channels,
    error,
    hasNextPage,
    loadingChannels:
      activeQueryType === 'queryLocalDB' ? true : activeQueryType === 'reload' && channels === null,
    loadingNextPage: activeQueryType === 'loadChannels',
    loadNextPage,
    refreshing: activeQueryType === 'refresh',
    refreshList,
    reloadList,
    // Although channels can be null, there is no practical case where channels will be null
    // when setChannels is used. setChannels is only recommended to be used for overriding
    // event handler. Thus instead of adding if check for channels === null, its better to
    // simply reassign types here.
    setChannels: setChannels as React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>,
    staticChannelsActive,
  };
};
