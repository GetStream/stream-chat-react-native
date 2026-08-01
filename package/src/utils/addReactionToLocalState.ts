import type {
  Channel,
  LocalMessage,
  ReactionGroupResponse,
  ReactionResponse,
  UserResponse,
} from 'stream-chat';

import { insertReaction, updateReaction } from '../store/apis';

/**
 * Optimistically applies a reaction to a locally-cached message, mirroring the reaction math the
 * (now removed) `channel.state.addReaction` used to perform. Returns a NEW message object with the
 * updated `reaction_groups` / `own_reactions` / `latest_reactions` — the input is never mutated, so
 * ingesting the result keeps the paginator update reactive. In this offline path the reactor is
 * always the current user.
 *
 * TODO(reactions): delete this local re-implementation once the client exposes optimistic reaction
 * support (its `messagePaginator.reflectReaction` is WS-shaped — it expects server-computed
 * `reaction_groups` — so it cannot back an optimistic update yet).
 */
const getMessageWithReaction = ({
  enforceUniqueReaction,
  message,
  reaction,
  userId,
}: {
  enforceUniqueReaction: boolean;
  message: LocalMessage;
  reaction: ReactionResponse;
  userId?: string;
}): LocalMessage => {
  const score = reaction.score ?? 1;
  const reactionGroups: Record<string, ReactionGroupResponse> = {
    ...(message.reaction_groups ?? {}),
  };
  let ownReactions = message.own_reactions ? [...message.own_reactions] : [];
  let latestReactions = message.latest_reactions ? [...message.latest_reactions] : [];

  // 1. When enforcing uniqueness, first back the current user's existing reactions out of the groups.
  if (enforceUniqueReaction) {
    for (const ownReaction of ownReactions) {
      const group = reactionGroups[ownReaction.type];
      if (!group) {
        continue;
      }
      const next = {
        ...group,
        count: group.count - 1,
        sum_scores: group.sum_scores - (ownReaction.score ?? 1),
      };
      if (next.count < 1) {
        delete reactionGroups[ownReaction.type];
      } else {
        reactionGroups[ownReaction.type] = next;
      }
    }
  }

  // 2. Add the new reaction to its group.
  const existingGroup = reactionGroups[reaction.type];
  reactionGroups[reaction.type] = existingGroup
    ? {
        ...existingGroup,
        count: existingGroup.count + 1,
        last_reaction_at: reaction.created_at,
        sum_scores: existingGroup.sum_scores + score,
      }
    : {
        count: 1,
        first_reaction_at: reaction.created_at,
        last_reaction_at: reaction.created_at,
        latest_reactions_by: [],
        sum_scores: score,
      };

  // 3. Update own_reactions (the reactor is always the current user in this path).
  ownReactions = enforceUniqueReaction
    ? []
    : ownReactions.filter((r) => r.user_id !== reaction.user_id || r.type !== reaction.type);
  if (userId === reaction.user_id) {
    ownReactions.push(reaction);
  }

  // 4. Update latest_reactions, respecting uniqueness.
  latestReactions = enforceUniqueReaction
    ? [...latestReactions.filter((r) => r.user_id !== userId), reaction]
    : [...latestReactions, reaction];

  return {
    ...message,
    latest_reactions: latestReactions,
    own_reactions: ownReactions,
    reaction_groups: reactionGroups,
  };
};

export const addReactionToLocalState = async ({
  channel,
  enforceUniqueReaction,
  messageId,
  reactionType,
  user,
}: {
  channel: Channel;
  enforceUniqueReaction: boolean;
  messageId: string;
  reactionType: string;
  user: UserResponse;
}): Promise<LocalMessage | undefined> => {
  const message = channel.messagePaginator.getItem(messageId);

  if (!message) {
    return;
  }

  const reaction: ReactionResponse = {
    created_at: new Date(),
    custom: {},
    message_id: messageId,
    score: 1,
    type: reactionType,
    updated_at: new Date(),
    user,
    user_id: user?.id,
  };

  const hasOwnReaction = message.own_reactions && message.own_reactions.length > 0;

  const messageWithReaction = getMessageWithReaction({
    enforceUniqueReaction,
    message,
    reaction,
    userId: user?.id,
  });

  if (enforceUniqueReaction && hasOwnReaction) {
    await updateReaction({
      message: messageWithReaction,
      reaction,
    });
  } else {
    await insertReaction({
      message: messageWithReaction,
      reaction,
    });
  }

  return messageWithReaction;
};
