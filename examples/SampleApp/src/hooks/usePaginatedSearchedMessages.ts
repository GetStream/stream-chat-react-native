import { useEffect, useRef, useState } from 'react';

import { useAppContext } from '../context/AppContext';

import type { MessageFilters, MessageResponse } from 'stream-chat';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';
import { DEFAULT_PAGINATION_LIMIT } from '../utils/constants';

export const usePaginatedSearchedMessages = (
  messageFilters:
    | string
    | MessageFilters<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      > = {},
) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | boolean>(false);
  const [messages, setMessages] =
    useState<
      MessageResponse<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      >[]
    >();
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

      const res = await chatClient?.search(
        {
          members: {
            $in: [chatClient?.user?.id || null],
          },
        },
        messageFilters,
        {
          limit: DEFAULT_PAGINATION_LIMIT,
          offset: offset.current,
        },
      );

      const newMessages = res?.results.map((r) => r.message);
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
  }, [messageFilters]);

  const refreshList = () => {
    if (!chatClient?.user?.id) return;

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
