import { useCallback, useEffect, useMemo, useState } from 'react';

import { LocalMessage, ReactionResponse, SortParamRequest } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { useNotificationApi } from '../../Notifications';

export type UseFetchReactionParams = {
  limit?: number;
  message?: LocalMessage;
  reactionType?: string;
  sort?: SortParamRequest[];
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
  const { t } = useTranslationContext();
  const { addNotification } = useNotificationApi();

  const sortString = useMemo(() => JSON.stringify(sort), [sort]);

  const notifyFetchFailed = useStableCallback((error: unknown) => {
    addNotification({
      message: t('messageMenu.userReactions.fetchFailed.error', 'Error fetching reactions'),
      options: {
        ...(error instanceof Error ? { originalError: error } : {}),
        severity: 'error',
        type: 'api:message:reactions:fetch:failed',
      },
      origin: {
        ...(message ? { context: { message } } : {}),
        emitter: 'Reactions',
      },
    });
  });

  const fetchReactions = useCallback(
    async (next: string | undefined) => {
      if (!messageId) {
        return;
      }
      try {
        const response = await client.queryReactionsAndHydrate(
          { id: messageId },
          { filter: reactionType ? { type: reactionType } : undefined, limit, next, sort },
        );
        if (response) {
          setNext(response.next);

          setReactions((prevReactions) =>
            next ? [...prevReactions, ...response.reactions] : response.reactions,
          );
          setLoading(false);
        }
      } catch (error) {
        notifyFetchFailed(error);
      }
    },
    [client, limit, messageId, notifyFetchFailed, reactionType, sort],
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
        // The event does not say which message was queried.
        const isForThisQuery = offlineReactions?.every(
          (reaction) =>
            reaction.message_id === messageId && (!reactionType || reaction.type === reactionType),
        );
        if (offlineReactions && isForThisQuery) {
          setReactions(offlineReactions);
          setLoading(false);
          setNext(undefined);
        }
      }),
    );

    listeners.push(
      client.on('reaction.new', (event) => {
        const { reaction } = event;

        if (reaction && reaction.message_id === messageId) {
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

        if (reaction && reaction.message_id === messageId) {
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

        if (reaction && reaction.message_id === messageId) {
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
  }, [client, messageId, reactionType]);

  return { loading, loadNextPage, reactions };
};
