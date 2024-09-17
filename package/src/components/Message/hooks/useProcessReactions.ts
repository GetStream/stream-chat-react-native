import { ComponentType, useMemo } from 'react';

import { ReactionResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { ReactionData } from '../../../utils/utils';
import { ReactionListProps } from '../MessageSimple/ReactionList';

export type ReactionSummary = {
  own: boolean;
  type: string;
  count?: number;
  firstReactionAt?: Date | null;
  Icon?: ComponentType | null;
  lastReactionAt?: Date | null;
  latestReactedUserNames?: string[];
  unlistedReactedUserCount?: number;
};

export type ReactionsComparator = (a: ReactionSummary, b: ReactionSummary) => number;

type UseProcessReactionsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  ReactionListProps<StreamChatGenerics>,
  'own_reactions' | 'reaction_groups' | 'latest_reactions'
> &
  Partial<Pick<MessagesContextValue<StreamChatGenerics>, 'supportedReactions'>> & {
    sortReactions?: ReactionsComparator;
  };

export const defaultReactionsSort: ReactionsComparator = (a, b) => {
  if (a.firstReactionAt && b.firstReactionAt) {
    return +a.firstReactionAt - +b.firstReactionAt;
  }

  return a.type.localeCompare(b.type, 'en');
};

const isOwnReaction = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  reactionType: string,
  ownReactions?: ReactionResponse<StreamChatGenerics>[] | null,
  latestReactions?: ReactionResponse<StreamChatGenerics>[] | null,
  userID?: string,
) =>
  (ownReactions ? ownReactions.some((reaction) => reaction.type === reactionType) : false) ||
  (latestReactions
    ? latestReactions.some(
        (reaction) => reaction?.user?.id === userID && reaction.type === reactionType,
      )
    : false);

const isSupportedReaction = (reactionType: string, supportedReactions: ReactionData[]) =>
  supportedReactions
    ? supportedReactions.some((reactionOption) => reactionOption.type === reactionType)
    : false;

const getEmojiByReactionType = (reactionType: string, supportedReactions: ReactionData[]) =>
  supportedReactions.find(({ type }) => type === reactionType)?.Icon ?? null;

const getLatestReactedUserNames = (reactionType: string, latestReactions?: ReactionResponse[]) =>
  latestReactions
    ? latestReactions.flatMap((reaction) => {
        if (reactionType && reactionType === reaction.type) {
          const username = reaction.user?.name || reaction.user?.id;
          return username ? [username] : [];
        }
        return [];
      })
    : [];

/**
 * Custom hook to process reactions data from message and return a list of reactions with additional info.
 */
export const useProcessReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: UseProcessReactionsParams<StreamChatGenerics>,
) => {
  const { supportedReactions: contextSupportedReactions } = useMessagesContext();
  const { client } = useChatContext<StreamChatGenerics>();

  const {
    latest_reactions,
    own_reactions,
    reaction_groups,
    sortReactions = defaultReactionsSort,
    supportedReactions = contextSupportedReactions,
  } = props;

  return useMemo(() => {
    if (!reaction_groups)
      return { existingReactions: [], hasReactions: false, totalReactionCount: 0 };
    const unsortedReactions = Object.entries(reaction_groups).flatMap(
      ([reactionType, { count, first_reaction_at, last_reaction_at }]) => {
        if (count === 0 || !isSupportedReaction(reactionType, supportedReactions)) return [];

        const latestReactedUserNames = getLatestReactedUserNames(reactionType, latest_reactions);

        return {
          count,
          firstReactionAt: first_reaction_at ? new Date(first_reaction_at) : null,
          Icon: getEmojiByReactionType(reactionType, supportedReactions),
          lastReactionAt: last_reaction_at ? new Date(last_reaction_at) : null,
          latestReactedUserNames,
          own: isOwnReaction<StreamChatGenerics>(
            reactionType,
            own_reactions,
            latest_reactions,
            client.userID,
          ),
          type: reactionType,
          unlistedReactedUserCount: count - latestReactedUserNames.length,
        };
      },
    );

    return {
      existingReactions: unsortedReactions.sort(sortReactions),
      hasReactions: unsortedReactions.length > 0,
      totalReactionCount: unsortedReactions.reduce((total, { count }) => total + count, 0),
    };
  }, [
    client.userID,
    reaction_groups,
    own_reactions,
    latest_reactions,
    supportedReactions,
    sortReactions,
  ]);
};
