import { useEffect, useRef, useState } from 'react';

import { useAppContext } from '../context/AppContext';

import { DEFAULT_PAGINATION_LIMIT } from '../utils/constants';

export const usePaginatedPinnedMessages = (channel: unknown) => {
  const { chatClient } = useAppContext();
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | boolean>(false);
  const [messages, setMessages] = useState<unknown[]>([]);

  const fetchPinnedMessages = async () => {
    if (queryInProgress.current) {
      return;
    }

    setLoading(true);

    try {
      queryInProgress.current = true;

      offset.current = offset.current + messages.length;

      if (!hasMoreResults.current) {
        queryInProgress.current = false;
        setLoading(false);
        return;
      }

      const newMessages = null;

      if (!newMessages) {
        queryInProgress.current = false;
        setLoading(false);
        return;
      }

      setMessages((existingMessages) => existingMessages.concat(newMessages));

      if (newMessages) {
        hasMoreResults.current = false;
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
    }
    queryInProgress.current = false;
    setLoading(false);
  };

  const loadMore = () => {
    fetchPinnedMessages();
  };

  useEffect(() => {
    fetchPinnedMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    error,
    loading,
    loadMore,
    messages,
  };
};
