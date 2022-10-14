import type { Channel, ReactionResponse, UserResponse } from 'stream-chat';

import { updateReaction } from '../store/apis';
import { insertReaction } from '../store/apis/insertReaction';

import type { DefaultStreamChatGenerics } from '../types/types';

export const addReactionToLocalState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  enforceUniqueReaction,
  messageId,
  reactionType,
  user,
}: {
  channel: Channel<StreamChatGenerics>;
  enforceUniqueReaction: boolean;
  messageId: string;
  reactionType: string;
  user: UserResponse<StreamChatGenerics>;
}) => {
  const message = channel.state.messages.find(({ id }) => id === messageId);

  if (!message) return;

  const reaction: ReactionResponse = {
    created_at: new Date().toISOString(),
    message_id: messageId,
    type: reactionType,
    updated_at: new Date().toISOString(),
    user,
    user_id: user?.id,
  };

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
    if (currentReaction && message.reaction_counts) {
      message.reaction_counts[currentReaction?.type] =
        message.reaction_counts[currentReaction?.type] - 1;
    }

    if (!message.reaction_counts) {
      message.reaction_counts = {
        [reactionType]: 1,
      };
    } else {
      message.reaction_counts[reactionType] = (message.reaction_counts?.[reactionType] || 0) + 1;
    }
  } else {
    if (!message.reaction_counts) {
      message.reaction_counts = {
        [reactionType]: 1,
      };
    } else {
      message.reaction_counts[reactionType] = message.reaction_counts[reactionType] + 1;
    }
  }

  message.own_reactions = [...message.own_reactions, reaction];
  message.latest_reactions = [...message.latest_reactions, reaction];

  if (enforceUniqueReaction) {
    updateReaction({
      // @ts-ignore
      message,
      reaction,
    });
  } else {
    insertReaction({
      reaction,
    });
  }
};
