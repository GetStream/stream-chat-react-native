import { useEffect, useState } from 'react';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LiteralStringForUnion,
  UnknownType,
} from 'stream-chat';

import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type Parameters<
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  UserType extends UnknownType = UnknownType
> = {
  filters: ChannelFilters<ChannelType, CommandType, UserType>;
  options: ChannelOptions;
  sort: ChannelSort<ChannelType>;
};

export const usePaginatedChannels = <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  filters = {},
  options = {},
  sort = {},
}: Parameters<ChannelType, CommandType, UserType>) => {
  const { client } = useChatContext<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >();

  const [channels, setChannels] = useState<
    Channel<
      AttachmentType,
      ChannelType,
      CommandType,
      EventType,
      MessageType,
      ReactionType,
      UserType
    >[]
  >([]);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const queryChannels = async (
    queryType = '',
    retryCount = 0,
  ): Promise<void> => {
    if (loadingChannels || loadingNextPage || refreshing) return;

    if (queryType === 'reload') {
      setChannels([]);
      setLoadingChannels(true);
    } else if (queryType === 'refresh') {
      setRefreshing(true);
    } else if (!queryType) {
      setLoadingNextPage(true);
    }

    const newOptions = {
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
      offset: queryType === 'reload' ? 0 : offset,
      ...options,
    };

    try {
      const channelQueryResponse = await client.queryChannels(
        filters,
        sort,
        newOptions,
      );

      let newChannels;
      if (queryType === 'reload') {
        newChannels = channelQueryResponse;
      } else {
        newChannels = [...channels, ...channelQueryResponse];
      }

      setChannels(newChannels);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      setOffset(newChannels.length);
    } catch (e) {
      setLoadingChannels(false);
      setLoadingNextPage(false);
      setRefreshing(false);
      await wait(2000);

      if (retryCount === 3) {
        console.warn(e);
        return setError(true);
      }

      return queryChannels(queryType, retryCount + 1);
    }

    setLoadingChannels(false);
    setLoadingNextPage(false);
    setRefreshing(false);
  };

  const loadNextPage = () => {
    if (hasNextPage) return queryChannels();
    return null;
  };
  const refreshList = () => queryChannels('refresh');
  const reloadList = () => queryChannels('reload');

  useEffect(() => {
    if (client) {
      reloadList();
    }
  }, [filters]);

  return {
    channels,
    hasNextPage,
    loadNextPage,
    refreshList,
    reloadList,
    setChannels,
    status: {
      error,
      loadingChannels,
      loadingNextPage,
      refreshing,
    },
  };
};
