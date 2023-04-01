import type { MessageResponse } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
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

  const handleToggleReaction = async (reactionType: string) => {
    const messageId = message.id;
    const own_reactions = message.own_reactions ?? [];
    const userExistingReaction = own_reactions.find((reaction) => {
      // own user should only ever contain the current user id
      // just in case we check to prevent bugs with message updates from breaking reactions
      if (reaction.user && client.userID === reaction.user.id && reaction.type === reactionType) {
        return true;
      } else if (reaction.user && client.userID !== reaction.user.id) {
        console.warn(
          `message.own_reactions contained reactions from a different user, this indicates a bug`,
        );
      }
      return false;
    });
    // Change reaction in local state, make API call in background, revert to old message if fails
    try {
      if (channel && messageId) {
        if (userExistingReaction) {
          await deleteReaction(userExistingReaction.type, messageId);
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
