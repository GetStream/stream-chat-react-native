import type { Channel, UserResponse } from 'stream-chat';

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
}) => {
  const message = channel.state.messages.find(({ id }) => id === messageId);
  if (!message || !channel?.id || !user?.id) {
    return;
  }

  message.own_reactions = message.own_reactions?.filter(
    (reaction) => reaction.type !== reactionType,
  );
  message.latest_reactions = message.latest_reactions?.filter(
    (r) => !(r.user_id === user?.id && r.type === reactionType),
  );

  if (message.reaction_groups?.[reactionType]) {
    if (
      message.reaction_groups[reactionType].count > 0 ||
      message.reaction_groups[reactionType].sum_scores > 0
    ) {
      message.reaction_groups[reactionType].count = Math.max(
        0,
        message.reaction_groups[reactionType].count - 1,
      );
      message.reaction_groups[reactionType].sum_scores = Math.max(
        0,
        message.reaction_groups[reactionType].sum_scores - 1,
      );
      if (
        message.reaction_groups[reactionType].count === 0 ||
        message.reaction_groups[reactionType].sum_scores === 0
      ) {
        delete message.reaction_groups[reactionType];
      }
    } else {
      delete message.reaction_groups[reactionType];
    }
  }
};
