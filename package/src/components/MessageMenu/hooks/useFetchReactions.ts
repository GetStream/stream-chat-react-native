import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReactionResponse, ReactionSort } from 'stream-chat';

import { MessageType } from '../../../components/MessageList/hooks/useMessageList';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { getReactionsForFilterSort } from '../../../store/apis/getReactionsforFilterSort';

export type UseFetchReactionParams = {
  limit?: number;
  message?: MessageType;
  reactionType?: string;
  sort?: ReactionSort;
};

export const useFetchReactions = ({
  limit = 25,
  message,
  reactionType,
  sort,
}: UseFetchReactionParams) => {
  const [reactions, setReactions] = useState<ReactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<string | undefined>(undefined);
  const messageId = message?.id;

  const { client, enableOfflineSupport } = useChatContext();

  const sortString = useMemo(() => JSON.stringify(sort), [sort]);

  const fetchReactions = useCallback(async () => {
    const loadOfflineReactions = async () => {
      if (!messageId) {
        return;
      }
      const reactionsFromDB = await getReactionsForFilterSort({
        currentMessageId: messageId,
        filters: reactionType ? { type: reactionType } : {},
        sort,
      });
      if (reactionsFromDB) {
        setReactions(reactionsFromDB);
        setLoading(false);
      }
    };

    const loadOnlineReactions = async () => {
      if (!messageId) {
        return;
      }
      const response = await client.queryReactions(
        messageId,
        reactionType ? { type: reactionType } : {},
        sort,
        { limit, next },
      );
      if (response) {
        setNext(response.next);
        setReactions((prevReactions) => [...prevReactions, ...response.reactions]);
        setLoading(false);
      }
    };

    try {
      // TODO: Threads are not supported for the offline use case as we don't store the thread messages currently, and this will change in the future.
      if (enableOfflineSupport && !message?.parent_id) {
        await loadOfflineReactions();
      } else {
        await loadOnlineReactions();
      }
    } catch (error) {
      console.log('Error fetching reactions: ', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, messageId, reactionType, sortString, next, enableOfflineSupport]);

  const loadNextPage = useCallback(async () => {
    if (next) {
      await fetchReactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReactions]);

  useEffect(() => {
    setReactions([]);
    setNext(undefined);
    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId, reactionType, sortString]);

  return { loading, loadNextPage, reactions };
};
