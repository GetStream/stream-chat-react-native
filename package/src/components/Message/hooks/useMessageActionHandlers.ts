import type { MessageResponse } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type {
  MessageContextValue,
  Reactions,
} from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useMessageActionHandlers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  client,
  deleteMessage,
  deleteReaction,
  message,
  retrySendMessage,
  sendReaction,
  setEditingState,
  setQuotedMessageState,
  supportedReactions,
}: Pick<
  MessagesContextValue<StreamChatGenerics>,
  | 'sendReaction'
  | 'deleteMessage'
  | 'deleteReaction'
  | 'retrySendMessage'
  | 'setEditingState'
  | 'setQuotedMessageState'
  | 'supportedReactions'
> &
  Pick<ChannelContextValue<StreamChatGenerics>, 'channel' | 'enforceUniqueReaction'> &
  Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Pick<MessageContextValue<StreamChatGenerics>, 'message'>) => {
  const handleResendMessage = () =>
    retrySendMessage(message as MessageResponse<StreamChatGenerics>);

  const handleQuotedReplyMessage = () => {
    setQuotedMessageState(message);
  };

  const isMuted = (client.mutedUsers || []).some(
    (mute) => mute.user.id === client.userID && mute.target.id === message.user?.id,
  );

  const handleDeleteMessage = async () => {
    await deleteMessage(message as MessageResponse<StreamChatGenerics>);
  };

  const handleToggleMuteUser = async () => {
    if (!message.user?.id) {
      return;
    }

    if (isMuted) {
      await client.unmuteUser(message.user.id);
    } else {
      await client.muteUser(message.user.id);
    }
  };

  const handleToggleBanUser = async () => {
    const messageUser = message.user;
    if (!messageUser) {
      return;
    }

    if (messageUser.banned) {
      await client.unbanUser(messageUser.id);
    } else {
      await client.banUser(messageUser.id);
    }
  };

  const handleTogglePinMessage = async () => {
    const MessagePinnedHeaderStatus = message.pinned;
    if (!MessagePinnedHeaderStatus) {
      await client.pinMessage(message, null);
    } else {
      await client.unpinMessage(message);
    }
  };

  const handleEditMessage = () => {
    setEditingState(message);
  };

  const clientId = client.userID;
  const isMessageTypeDeleted = message.type === 'deleted';

  const hasReactions =
    !isMessageTypeDeleted && !!message.latest_reactions && message.latest_reactions.length > 0;

  const reactions = hasReactions
    ? supportedReactions.reduce((acc, cur) => {
        const reactionType = cur.type;
        const reactionsOfReactionType = message.latest_reactions?.filter(
          (reaction) => reaction.type === reactionType,
        );

        if (reactionsOfReactionType?.length) {
          const hasOwnReaction = reactionsOfReactionType.some(
            (reaction) => reaction.user_id === clientId,
          );
          acc.push({ own: hasOwnReaction, type: reactionType });
        }

        return acc;
      }, [] as Reactions)
    : [];

  const handleToggleReaction = async (reactionType: string) => {
    const messageId = message.id;
    const ownReaction = !!reactions.find(
      (reaction) => reaction.own && reaction.type === reactionType,
    );

    // Change reaction in local state, make API call in background, revert to old message if fails
    try {
      if (channel && messageId) {
        if (ownReaction) {
          await deleteReaction(reactionType, messageId);
        } else {
          await sendReaction(reactionType, messageId);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  return {
    handleDeleteMessage,
    handleEditMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleTogglePinMessage,
    handleToggleReaction,
  };
};
