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

      // TODO: Use this when support for attachment_type is ready.
      const res = await chatClient?.search(
        {
          cid: { $in: [channel.cid] },
        },
        { pinned: true },
        {
          limit: 10,
          offset: offset.current,
        },
      );

      const newMessages = res?.results.map((r) => r.message);

      if (!newMessages) {
        queryInProgress.current = false;
        return;
      }

      setMessages((existingMessages) => existingMessages.concat(newMessages));

      if (newMessages.length < 10) {
        hasMoreResults.current = false;
      }
    } catch (e) {
      // do nothing;
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
    loading,
    loadMore,
    messages,
  };
};
