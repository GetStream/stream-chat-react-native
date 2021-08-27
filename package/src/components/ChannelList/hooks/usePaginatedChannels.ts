import { useEffect, useMemo, useRef, useState } from 'react';

import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

import { useActiveChannels } from '../../../contexts/channelsStateContext/useActiveChannels';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { Channel, ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type Parameters<
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = {
  filters: ChannelFilters<Ch, Co, Us>;
  options: ChannelOptions;
  sort: ChannelSort<Ch>;
};

const DEFAULT_OPTIONS = {
  message_limit: 10,
};

export const usePaginatedChannels = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  filters = {},
  options = DEFAULT_OPTIONS,
  sort = {},
}: Parameters<Ch, Co, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const activeChannels = useActiveChannels();

  const [channels, setChannels] = useState<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>([]);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const lastRefresh = useRef(Date.now());
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const queryChannels = async (queryType = '', retryCount = 0): Promise<void> => {
    if (!client || loadingChannels || loadingNextPage || refreshing) return;

    if (queryType === 'reload') {
      setLoadingChannels(true);
    } else if (queryType === 'refresh') {
      setRefreshing(true);
    } else if (!queryType) {
      setLoadingNextPage(true);
    }

    const newOptions = {
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
      offset: queryType === 'reload' || queryType === 'refresh' ? 0 : offset,
      ...options,
    };

    try {
      const channelQueryResponse = await client.queryChannels(filters, sort, newOptions, {
        skipInitialization: activeChannels.current,
      });

      channelQueryResponse.forEach((channel) => channel.state.setIsUpToDate(true));

      const newChannels =
        queryType === 'reload' || queryType === 'refresh'
          ? channelQueryResponse
          : [...channels, ...channelQueryResponse];

      setChannels(newChannels);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      setOffset(newChannels.length);
      setError(false);
    } catch (err) {
      await wait(2000);

      if (retryCount === 3) {
        setLoadingChannels(false);
        setLoadingNextPage(false);
        setRefreshing(false);
        console.warn(err);
        return setError(true);
      }

      return queryChannels(queryType, retryCount + 1);
    }

    setLoadingChannels(false);
    setLoadingNextPage(false);
    setRefreshing(false);
  };

  const loadNextPage = hasNextPage ? queryChannels : undefined;
  const refreshList = () => {
    const now = Date.now();
    // Only allow pull-to-refresh 5 seconds after last successful refresh.
    if (now - lastRefresh.current < 5000 && !error) {
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
    reloadList();
  }, [filterStr, sortStr]);

  return {
    channels,
    error,
    hasNextPage,
    loadingChannels,
    loadingNextPage,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
    setChannels,
  };
};
