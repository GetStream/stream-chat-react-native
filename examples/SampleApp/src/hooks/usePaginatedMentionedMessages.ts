import { useContext, useRef, useState } from 'react';
import { MessageResponse } from 'stream-chat';
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
export const usePaginatedMentionedMessages = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
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
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const { chatClient } = useContext(AppContext);

  const done = () => {
    queryInProgress.current = false;
    setLoading(false);
    setRefreshing(false);
  };
  const fetchMessages = async (refresh = false) => {
    if (refresh) {
      offset.current = 0;
      hasMoreResults.current = true;
      setRefreshing(true);
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

      // TODO: Use this when support for filtering by mentioned user id is ready on backend.
      const res = await chatClient?.search(
        {
          id: { $in: ['channel-ex-slack-demo-8', 'channel-ex-slack-demo-15'] },
        },
        'Unsatiable',
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

      if (refresh) {
        setMessages(newMessages);
      } else {
        setMessages((existingMessages) => existingMessages.concat(newMessages));
      }

      if (newMessages.length < 10) {
        hasMoreResults.current = false;
      }

      offset.current = offset.current + messages.length;
    } catch (e) {
      // do nothing;
    }

    done();
  };

  const loadMore = () => {
    fetchMessages();
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return {
    loading,
    loadMore,
    messages,
    refreshing,
    refreshList: fetchMessages.bind(null, true),
  };
};
