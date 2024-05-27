import { ComponentType, useCallback, useMemo } from 'react';

import { useMessageContext } from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { ReactionListProps } from '../MessageSimple/ReactionList';

export type ReactionSummary = {
  count: number;
  firstReactionAt: Date | null;
  Icon: ComponentType | null;
  isOwnReaction: boolean;
  lastReactionAt: Date | null;
  latestReactedUserNames: string[];
  type: string;
  unlistedReactedUserCount: number;
};

export type ReactionsComparator = (a: ReactionSummary, b: ReactionSummary) => number;

type UseProcessReactionsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  ReactionListProps<StreamChatGenerics>,
  'own_reactions' | 'reaction_groups' | 'latest_reactions'
> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'supportedReactions'> & {
    sortReactions?: ReactionsComparator;
  };

export const defaultReactionsSort: ReactionsComparator = (a, b) => {
  if (a.firstReactionAt && b.firstReactionAt) {
    return +a.firstReactionAt - +b.firstReactionAt;
  }

  return a.type.localeCompare(b.type, 'en');
};

export const useProcessReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: UseProcessReactionsParams<StreamChatGenerics>,
) => {
  const {
    latest_reactions: propLatestReactions,
    own_reactions: propOwnReactions,
    reaction_groups: propReactionGroups,
    sortReactions: propSortReactions,
    supportedReactions: propSupportedReactions,
  } = props;

  const { message } = useMessageContext();
  const { supportedReactions: contextSupportedReactions } = useMessagesContext();
  const supportedReactions = propSupportedReactions || contextSupportedReactions;
  const latestReactions = propLatestReactions || message.latest_reactions;
  const ownReactions = propOwnReactions || message?.own_reactions;
  const reactionGroups = propReactionGroups || message?.reaction_groups;
  const sortReactions = propSortReactions || defaultReactionsSort;

  const isOwnReaction = useCallback(
    (reactionType: string) =>
      ownReactions?.some((reaction) => reaction.type === reactionType) ?? false,
    [ownReactions],
  );

  const getEmojiByReactionType = useCallback(
    (reactionType: string) =>
      supportedReactions.find(({ type }) => type === reactionType)?.Icon ?? null,
    [supportedReactions],
  );

  const isSupportedReaction = useCallback(
    (reactionType: string) =>
      supportedReactions.some((reactionOption) => reactionOption.type === reactionType),
    [supportedReactions],
  );

  const getLatestReactedUserNames = useCallback(
    (reactionType?: string) =>
      latestReactions?.flatMap((reaction) => {
        if (reactionType && reactionType === reaction.type) {
          const username = reaction.user?.name || reaction.user?.id;
          return username ? [username] : [];
        }
        return [];
      }) ?? [],
    [latestReactions],
  );

  const existingReactions = useMemo(() => {
    if (!reactionGroups) return [];
    const unsortedReactions = Object.entries(reactionGroups).flatMap(
      ([reactionType, { count, first_reaction_at, last_reaction_at }]) => {
        if (count === 0 || !isSupportedReaction(reactionType)) return [];

        const latestReactedUserNames = getLatestReactedUserNames(reactionType);

        return {
          count,
          firstReactionAt: first_reaction_at ? new Date(first_reaction_at) : null,
          Icon: getEmojiByReactionType(reactionType),
          isOwnReaction: isOwnReaction(reactionType),
          lastReactionAt: last_reaction_at ? new Date(last_reaction_at) : null,
          latestReactedUserNames,
          type: reactionType,
          unlistedReactedUserCount: count - latestReactedUserNames.length,
        };
      },
    );

    return unsortedReactions.sort(sortReactions);
  }, [
    getEmojiByReactionType,
    getLatestReactedUserNames,
    isOwnReaction,
    isSupportedReaction,
    reactionGroups,
    sortReactions,
  ]);

  const hasReactions = existingReactions.length > 0;

  const totalReactionCount = useMemo(
    () => existingReactions.reduce((total, { count }) => total + count, 0),
    [existingReactions],
  );

  return { existingReactions, hasReactions, totalReactionCount };
};
