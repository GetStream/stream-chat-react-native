import { useCallback, useEffect, useMemo, useState } from 'react';

import { LocalMessage, ReactionResponse, ReactionSort } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

export type UseFetchReactionParams = {
  limit?: number;
  message?: LocalMessage;
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
    if (!messageId) {
      return;
    }
    try {
      const response = await client.queryReactions(
        messageId,
        reactionType ? { type: reactionType } : {},
        sort,
        { limit, next },
      );
      if (response) {
        setReactions((prevReactions) =>
          next ? [...prevReactions, ...response.reactions] : response.reactions,
        );
        setNext(response.next);
        setLoading(false);
      }
    } catch (error) {
      console.log('Error fetching reactions: ', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, messageId, reactionType, sortString, next, limit, enableOfflineSupport]);

  const loadNextPage = useCallback(async () => {
    if (next) {
      await fetchReactions();
    }
  }, [fetchReactions, next]);

  useEffect(() => {
    setReactions([]);
    setNext(undefined);
    fetchReactions();
  }, [fetchReactions, messageId, reactionType, sortString]);

  useEffect(() => {
    const listeners: ReturnType<typeof client.on>[] = [];
    listeners.push(
      client.on('offline_reactions.queried', (event) => {
        const { offlineReactions } = event;
        if (offlineReactions) {
          setReactions(offlineReactions);
          setLoading(false);
          setNext(undefined);
        }
      }),
    );

    listeners.push(
      client.on('reaction.new', (event) => {
        const { reaction } = event;

        if (reaction && reaction.type === reactionType) {
          setReactions((prevReactions) => [reaction, ...prevReactions]);
        }
      }),
    );

    listeners.push(
      client.on('reaction.updated', (event) => {
        const { reaction } = event;

        if (reaction) {
          if (reaction.type === reactionType) {
            setReactions((prevReactions) => [reaction, ...prevReactions]);
          } else {
            setReactions((prevReactions) =>
              prevReactions.filter((r) => r.user_id !== reaction.user_id),
            );
          }
        }
      }),
    );

    listeners.push(
      client.on('reaction.deleted', (event) => {
        const { reaction } = event;

        if (reaction && reaction.type === reactionType) {
          setReactions((prevReactions) =>
            prevReactions.filter((r) => r.user_id !== reaction.user_id),
          );
        }
      }),
    );

    return () => {
      listeners.forEach((listener) => {
        listener?.unsubscribe();
      });
    };
  }, [client, reactionType]);

  return { loading, loadNextPage, reactions };
};
