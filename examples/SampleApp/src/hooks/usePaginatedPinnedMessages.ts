import { useContext, useEffect, useRef, useState } from 'react';

import { AppContext } from '../context/AppContext';

import type { Channel, MessageResponse } from 'stream-chat';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';
import { DEFAULT_PAGINATION_LIMIT } from '../utils/constants';

export const usePaginatedPinnedMessages = (
  channel: Channel<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >,
) => {
  const { chatClient } = useContext(AppContext);
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState<
    MessageResponse<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >[]
  >([]);

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
        return;
      }

      const res = await chatClient?.search(
        {
          cid: { $in: [channel.cid] },
        },
        { pinned: true },
        {
          limit: DEFAULT_PAGINATION_LIMIT,
          offset: offset.current,
        },
      );

      const newMessages = res?.results.map((r) => r.message);

      if (!newMessages) {
        queryInProgress.current = false;
        return;
      }

      setMessages((existingMessages) => existingMessages.concat(newMessages));

      if (newMessages.length < DEFAULT_PAGINATION_LIMIT) {
        hasMoreResults.current = false;
      }
    } catch (error) {
      setError(error);
    }
    queryInProgress.current = false;
    setLoading(false);
  };

  const loadMore = () => {
    fetchPinnedMessages();
  };

  useEffect(() => {
    fetchPinnedMessages();
  }, []);

  return {
    error,
    loading,
    loadMore,
    messages,
  };
};
