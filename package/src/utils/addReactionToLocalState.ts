import type { Channel, ReactionResponse, UserResponse } from 'stream-chat';

import { updateReaction } from '../store/apis';
import { insertReaction } from '../store/apis/insertReaction';

export const addReactionToLocalState = ({
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
}) => {
  const message = channel.state.messages.find(({ id }) => id === messageId);

  if (!message) {
    return;
  }

  const reaction: ReactionResponse = {
    created_at: new Date().toISOString(),
    message_id: messageId,
    type: reactionType,
    updated_at: new Date().toISOString(),
    user,
    user_id: user?.id,
  };

  const hasOwnReaction = message.own_reactions && message.own_reactions.length > 0;
  if (!message.own_reactions) {
    message.own_reactions = [];
  }

  if (!message.latest_reactions) {
    message.latest_reactions = [];
  }

  if (enforceUniqueReaction) {
    const currentReaction = message.own_reactions[0];
    message.own_reactions = [];
    if (!message.latest_reactions) {
      message.latest_reactions = [];
    }
    message.latest_reactions = message.latest_reactions.filter((r) => r.user_id !== user.id);

    if (
      currentReaction &&
      message.reaction_groups &&
      message.reaction_groups[currentReaction.type] &&
      message.reaction_groups[currentReaction.type].count > 0 &&
      message.reaction_groups[currentReaction.type].sum_scores > 0
    ) {
      message.reaction_groups[currentReaction.type].count =
        message.reaction_groups[currentReaction.type].count - 1;
      message.reaction_groups[currentReaction.type].sum_scores =
        message.reaction_groups[currentReaction.type].sum_scores - 1;
    }

    if (!message.reaction_groups) {
      message.reaction_groups = {
        [reactionType]: {
          count: 1,
          first_reaction_at: new Date().toISOString(),
          last_reaction_at: new Date().toISOString(),
          sum_scores: 1,
        },
      };
    } else {
      if (!message.reaction_groups[reactionType]) {
        message.reaction_groups[reactionType] = {
          count: 1,
          first_reaction_at: new Date().toISOString(),
          last_reaction_at: new Date().toISOString(),
          sum_scores: 1,
        };
      } else {
        message.reaction_groups[reactionType] = {
          ...message.reaction_groups[reactionType],
          count: message.reaction_groups[reactionType].count + 1,
          last_reaction_at: new Date().toISOString(),
          sum_scores: message.reaction_groups[reactionType].sum_scores + 1,
        };
      }
    }
  }

  message.own_reactions = [...message.own_reactions, reaction];
  message.latest_reactions = [...message.latest_reactions, reaction];

  if (enforceUniqueReaction && hasOwnReaction) {
    updateReaction({
      message,
      reaction,
    });
  } else {
    insertReaction({
      message,
      reaction,
    });
  }
};
