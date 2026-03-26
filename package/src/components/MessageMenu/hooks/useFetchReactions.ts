import { useCallback, useEffect, useMemo, useState } from 'react';

import { LocalMessage, ReactionResponse, ReactionSort } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

export type UseFetchReactionParams = {
  limit?: number;
  message?: LocalMessage;
  reactionType?: string;
  sort?: ReactionSort;
};

const isSameReaction = (left: ReactionResponse, right: ReactionResponse) =>
  left.user_id === right.user_id && left.type === right.type;

export const upsertReactionInList = ({
  prevReactions,
  reaction,
  reactionType,
}: {
  prevReactions: ReactionResponse[];
  reaction: ReactionResponse;
  reactionType?: string;
}) => {
  if (!reactionType) {
    return [
      reaction,
      ...prevReactions.filter((currentReaction) => !isSameReaction(currentReaction, reaction)),
    ];
  }

  if (reaction.type !== reactionType) {
    return prevReactions;
  }

  return [
    reaction,
    ...prevReactions.filter((currentReaction) => currentReaction.user_id !== reaction.user_id),
  ];
};

export const reconcileUpdatedReactionInList = ({
  prevReactions,
  reaction,
  reactionType,
}: {
  prevReactions: ReactionResponse[];
  reaction: ReactionResponse;
  reactionType?: string;
}) => {
  if (!reactionType) {
    return [
      reaction,
      ...prevReactions.filter((currentReaction) => !isSameReaction(currentReaction, reaction)),
    ];
  }

  if (reaction.type !== reactionType) {
    return prevReactions.filter((currentReaction) => currentReaction.user_id !== reaction.user_id);
  }

  return [
    reaction,
    ...prevReactions.filter((currentReaction) => currentReaction.user_id !== reaction.user_id),
  ];
};

export const removeReactionFromList = ({
  prevReactions,
  reaction,
  reactionType,
}: {
  prevReactions: ReactionResponse[];
  reaction: ReactionResponse;
  reactionType?: string;
}) => {
  if (!reactionType) {
    return prevReactions.filter((currentReaction) => !isSameReaction(currentReaction, reaction));
  }

  if (reaction.type !== reactionType) {
    return prevReactions;
  }

  return prevReactions.filter((currentReaction) => currentReaction.user_id !== reaction.user_id);
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

        if (reaction) {
          setReactions((prevReactions) =>
            upsertReactionInList({
              prevReactions,
              reaction,
              reactionType,
            }),
          );
        }
      }),
    );

    listeners.push(
      client.on('reaction.updated', (event) => {
        const { reaction } = event;

        if (reaction) {
          setReactions((prevReactions) =>
            reconcileUpdatedReactionInList({
              prevReactions,
              reaction,
              reactionType,
            }),
          );
        }
      }),
    );

    listeners.push(
      client.on('reaction.deleted', (event) => {
        const { reaction } = event;

        if (reaction) {
          setReactions((prevReactions) =>
            removeReactionFromList({
              prevReactions,
              reaction,
              reactionType,
            }),
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
