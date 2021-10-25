import type { MessageResponse, Reaction } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import type { Reactions } from '../../../contexts/messageContext/MessageContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useMessageActionHandlers = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  channel,
  client,
  enforceUniqueReaction,
  message,
  reactionsEnabled,
  retrySendMessage,
  setEditingState,
  setQuotedMessageState,
  supportedReactions,
  updateMessage,
}: Pick<
  MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'reactionsEnabled'
  | 'retrySendMessage'
  | 'setEditingState'
  | 'setQuotedMessageState'
  | 'supportedReactions'
  | 'updateMessage'
> &
  Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'channel' | 'enforceUniqueReaction'> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'message'>) => {
  const handleResendMessage = () =>
    retrySendMessage(message as MessageResponse<At, Ch, Co, Me, Re, Us>);

  const handleQuotedReplyMessage = () => {
    setQuotedMessageState(message);
  };

  const isMuted = (client.mutedUsers || []).some(
    (mute) => mute.user.id === client.userID && mute.target.id === message.user?.id,
  );

  const handleDeleteMessage = async () => {
    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
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
    !!reactionsEnabled &&
    !isMessageTypeDeleted &&
    !!message.latest_reactions &&
    message.latest_reactions.length > 0;

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
          await channel.deleteReaction(messageId, reactionType);
        } else {
          await channel.sendReaction(
            messageId,
            {
              type: reactionType,
            } as Reaction<Re, Us>,
            { enforce_unique: enforceUniqueReaction },
          );
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
