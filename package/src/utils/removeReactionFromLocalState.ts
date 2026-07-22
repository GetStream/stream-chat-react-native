import type {
  Channel,
  LocalMessage,
  ReactionGroupResponse,
  ReactionResponse,
  UserResponse,
} from 'stream-chat';

/**
 * Optimistically removes the current user's reaction of `reactionType` from a locally-cached
 * message, mirroring the (now removed) `channel.state.removeReaction`. Returns a NEW message object
 * (the input is never mutated). Unlike the add path this does not persist to SQLite — the client's
 * `channel.deleteReaction` handles offline removal persistence, matching the pre-migration behavior.
 *
 * TODO(reactions): delete this local re-implementation once the client exposes optimistic reaction
 * support.
 */
const getMessageWithoutReaction = ({
  message,
  reaction,
  userId,
}: {
  message: LocalMessage;
  reaction: ReactionResponse;
  userId?: string;
}): LocalMessage => {
  const reactionGroups: Record<string, ReactionGroupResponse> = {
    ...(message.reaction_groups ?? {}),
  };
  const reactionToRemove = message.own_reactions?.find((r) => r.type === reaction.type);

  if (reactionToRemove && reactionGroups[reactionToRemove.type]) {
    const group = reactionGroups[reactionToRemove.type];
    const next = {
      ...group,
      count: group.count - 1,
      sum_scores: group.sum_scores - (reactionToRemove.score ?? 1),
    };
    if (next.count < 1) {
      delete reactionGroups[reactionToRemove.type];
    } else {
      reactionGroups[reactionToRemove.type] = next;
    }
  }

  return {
    ...message,
    latest_reactions: message.latest_reactions?.filter(
      (r) => !(r.user_id === userId && r.type === reaction.type),
    ),
    own_reactions: message.own_reactions?.filter((r) => r.type !== reaction.type),
    reaction_groups: reactionGroups,
  };
};

export const removeReactionFromLocalState = ({
  channel,
  messageId,
  reactionType,
  user,
}: {
  channel: Channel;
  messageId: string;
  reactionType: string;
  user: UserResponse;
}): LocalMessage | undefined => {
  const message = channel.messagePaginator.getItem(messageId);

  if (!message) {
    return;
  }

  const reaction: ReactionResponse = {
    created_at: '',
    message_id: messageId,
    type: reactionType,
    updated_at: '',
    user,
    user_id: user?.id,
  };

  return getMessageWithoutReaction({ message, reaction, userId: user?.id });
};
