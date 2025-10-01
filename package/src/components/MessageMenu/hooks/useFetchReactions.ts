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

  const { client } = useChatContext();

  const sortString = useMemo(() => JSON.stringify(sort), [sort]);

  const fetchReactions = useCallback(
    async (next: string | undefined) => {
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
          setNext(response.next);

          setReactions((prevReactions) =>
            next ? [...prevReactions, ...response.reactions] : response.reactions,
          );
          setLoading(false);
        }
      } catch (error) {
        console.log('Error fetching reactions: ', error);
      }
    },
    [messageId, client, reactionType, sort, limit],
  );

  const loadNextPage = useCallback(async () => {
    if (next) {
      await fetchReactions(next);
    }
  }, [fetchReactions, next]);

  useEffect(() => {
    setReactions([]);
    setNext(undefined);
    fetchReactions(undefined);
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
