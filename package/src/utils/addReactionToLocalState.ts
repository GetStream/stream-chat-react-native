import type { Channel, ReactionResponse, UserResponse } from 'stream-chat';

import { insertReaction, updateReaction } from '../store/apis';

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

  const messageWithReaction = channel.state.addReaction(reaction, undefined, enforceUniqueReaction);

  if (!messageWithReaction) {
    return;
  }

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
};
