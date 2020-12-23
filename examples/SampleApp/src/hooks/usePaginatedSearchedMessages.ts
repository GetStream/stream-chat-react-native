import { useContext, useRef, useState } from 'react';
import { ChannelFilters, MessageFilters, MessageResponse } from 'stream-chat';
import { useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';

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
  const [refreshing, setRefreshing] = useState(true);
  const [messages, setMessages] = useState<
    | MessageResponse<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      >[]
    | null
  >(null);
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const { chatClient } = useContext(AppContext);

  const done = () => {
    queryInProgress.current = false;
    setLoading(false);
    setRefreshing(false);
  };

  const reset = () => {
    setMessages(null);
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
            $in: [chatClient?.user?.id],
          },
        },
        messageFilters,
        {
          limit: 10,
          offset: offset.current,
        },
      );

      const newMessages = res?.results.map((r) => r.message);
      if (!newMessages) {
        queryInProgress.current = false;
        done();
        return;
      }

      if (offset.current === 0) {
        setMessages(newMessages);
      } else {
        setMessages((existingMessages) => {
          if (!existingMessages) {
            return newMessages;
          }

          return existingMessages.concat(newMessages);
        });
      }

      if (newMessages.length < 10) {
        hasMoreResults.current = false;
      }

      offset.current = offset.current + (messages ? messages.length : 0);
    } catch (e) {
      // do nothing;
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
    setMessages([]);
    fetchMessages();
  };

  return {
    loading,
    loadMore,
    messages,
    refreshing,
    refreshList,
    reloadList,
    reset,
  };
};
