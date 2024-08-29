import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReactionResponse, ReactionSort } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { getReactionsForFilterSort } from '../../../store/apis/getReactionsforFilterSort';
import { DefaultStreamChatGenerics } from '../../../types/types';

export type UseFetchReactionParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  limit?: number;
  messageId?: string;
  reactionType?: string;
  sort?: ReactionSort<StreamChatGenerics>;
};

export const useFetchReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  limit = 25,
  messageId,
  reactionType,
  sort,
}: UseFetchReactionParams) => {
  const [reactions, setReactions] = useState<ReactionResponse<StreamChatGenerics>[]>([]);
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<string | undefined>(undefined);

  const { client, enableOfflineSupport } = useChatContext();

  const sortString = useMemo(() => JSON.stringify(sort), [sort]);

  const fetchReactions = useCallback(async () => {
    const loadOfflineReactions = () => {
      if (!messageId) return;
      const reactionsFromDB = getReactionsForFilterSort({
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
      if (!messageId) return;
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
      if (enableOfflineSupport) {
        loadOfflineReactions();
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
    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId, reactionType, sortString]);

  return { loading, loadNextPage, reactions };
};
