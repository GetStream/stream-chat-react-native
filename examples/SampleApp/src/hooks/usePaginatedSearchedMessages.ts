import { useEffect, useRef, useState } from 'react';

import type { MessageFilters, SearchResultMessage } from 'stream-chat';

import { useAppContext } from '../context/AppContext';

import { DEFAULT_PAGINATION_LIMIT } from '../utils/constants';

export const usePaginatedSearchedMessages = (messageFilters: string | MessageFilters = {}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | boolean>(false);
  const [messages, setMessages] = useState<SearchResultMessage[]>();
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const { chatClient } = useAppContext();

  const done = () => {
    queryInProgress.current = false;
    setLoading(false);
    setRefreshing(false);
  };

  const reset = () => {
    setMessages(undefined);
    offset.current = 0;
    hasMoreResults.current = true;
  };

  const fetchMessages = async () => {
    if (!messageFilters) {
      reset();
      done();
      return;
    }

    if (queryInProgress.current) {
      done();
      return;
    }

    setLoading(true);

    try {
      queryInProgress.current = true;

      if (!hasMoreResults.current) {
        queryInProgress.current = false;
        done();
        return;
      }

      // v10 collapses `search(filters, query, options)` into one payload object, and sort is an
      // array of `{ field, direction }` rather than a `{ field: direction }` map.
      const res = await chatClient?.search({
        payload: {
          filter_conditions: {
            members: {
              $in: [chatClient?.user?.id ?? ''],
            },
          },
          ...(typeof messageFilters === 'string'
            ? { query: messageFilters }
            : { message_filter_conditions: messageFilters }),
          limit: DEFAULT_PAGINATION_LIMIT,
          offset: offset.current,
          sort: [{ field: 'updated_at', direction: -1 }],
        },
      });

      const newMessages = res?.results
        .map((r) => r.message)
        .filter((m): m is SearchResultMessage => m !== undefined);
      if (!newMessages) {
        queryInProgress.current = false;
        done();
        return;
      }

      let messagesLength = 0;
      if (offset.current === 0) {
        messagesLength = newMessages.length;
        setMessages(newMessages);
      } else {
        setMessages((existingMessages) => {
          if (!existingMessages) {
            messagesLength = newMessages.length;
            return newMessages;
          }

          const returnMessages = existingMessages.concat(newMessages);
          messagesLength = returnMessages.length;
          return returnMessages;
        });
      }

      if (newMessages.length < DEFAULT_PAGINATION_LIMIT) {
        hasMoreResults.current = false;
      }

      offset.current = offset.current + messagesLength;
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
    }

    done();
  };

  const loadMore = () => {
    fetchMessages();
  };

  useEffect(() => {
    reloadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageFilters]);

  const refreshList = () => {
    if (!chatClient?.user?.id) {
      return;
    }

    offset.current = 0;
    hasMoreResults.current = true;

    setRefreshing(true);
    fetchMessages();
  };

  const reloadList = () => {
    reset();

    setMessages([]);
    fetchMessages();
  };

  return {
    error,
    loading,
    loadMore,
    messages,
    refreshing,
    refreshList,
    reloadList,
    reset,
  };
};
