import { useContext, useEffect, useState } from 'react';
import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';
import { ChatContext } from '../../../context';

export const usePaginatedCachedChannels = (
  filters = {},
  options = {},
  sort = {},
) => {
  const { storage } = useContext(ChatContext);
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [offset, setOffset] = useState(0);

  const queryChannels = async (queryType = '') => {
    if (loadingChannels || loadingNextPage) return;

    if (queryType === 'reload') {
      setChannels([]);
      setLoadingChannels(true);
    } else if (!queryType) {
      setLoadingNextPage(true);
    }

    const newOptions = {
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
      offset: queryType === 'reload' ? 0 : offset,
      ...options,
    };

    try {
      const channelQueryResponse = await storage.queryChannels(
        filters,
        sort,
        newOptions.offset,
        newOptions.limit,
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

      return setError(true);
    }

    setLoadingChannels(false);
    setLoadingNextPage(false);
  };

  const loadNextPage = () => {
    if (hasNextPage) return queryChannels();
  };

  const reloadList = () => queryChannels('reload');

  useEffect(() => {
    if (storage) {
      reloadList();
    }
  }, [filters]);

  return {
    channels,
    hasNextPage,
    loadNextPage,
    reloadList,
    setChannels,
    status: {
      error,
      loadingChannels,
      loadingNextPage,
    },
  };
};
