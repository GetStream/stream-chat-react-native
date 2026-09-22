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

      // v10 takes ONE request object with everything under `payload`. The v9 call was three
      // positional arguments (channel filters, message filters, options); the new signature is
      // `search({ payload })`, so those extra arguments were silently dropped and every search went
      // out with an empty payload — which is why this returned 0 results for messages that plainly
      // existed. `sort` is an array of `{ field, direction }` now, not an object.
      const res = await chatClient?.search({
        payload: {
          filter_conditions: {
            members: { $in: [chatClient?.user?.id || ''] },
          },
          limit: DEFAULT_PAGINATION_LIMIT,
          offset: offset.current,
          sort: [{ direction: -1, field: 'updated_at' }],
          // A plain string is free text; an object is a structured message filter.
          ...(typeof messageFilters === 'string'
            ? { query: messageFilters }
            : { message_filter_conditions: messageFilters }),
        },
      });

      // `results` entries carry an OPTIONAL message, so drop the empty ones rather than letting
      // `undefined` through into the list.
      const newMessages = res?.results
        .map((r) => r.message)
        .filter((m): m is SearchResultMessage => !!m);
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
