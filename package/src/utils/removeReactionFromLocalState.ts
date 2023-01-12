import type { Channel, UserResponse } from 'stream-chat';

import { deleteReaction } from '../store/apis/deleteReaction';

import type { DefaultStreamChatGenerics } from '../types/types';

export const removeReactionFromLocalState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  messageId,
  reactionType,
  user,
}: {
  channel: Channel<StreamChatGenerics>;
  messageId: string;
  reactionType: string;
  user: UserResponse<StreamChatGenerics>;
}) => {
  const message = channel.state.messages.find(({ id }) => id === messageId);
  if (!message || !channel?.id || !user?.id) return;

  message.own_reactions = message.own_reactions?.filter(
    (reaction) => reaction.type !== reactionType,
  );
  message.latest_reactions = message.latest_reactions?.filter(
    (r) => !(r.user_id === user?.id && r.type === reactionType),
  );

  if (message.reaction_counts?.[reactionType] && message.reaction_counts?.[reactionType] > 0) {
    message.reaction_counts[reactionType] = message.reaction_counts[reactionType] - 1;
  }

  deleteReaction({
    messageId,
    reactionType,
    userId: user.id,
  });
};
