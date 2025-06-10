import { Alert } from 'react-native';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import { MessageComposerAPIContextValue } from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { NativeHandlers } from '../../../native';

export const useMessageActionHandlers = ({
  channel,
  client,
  deleteMessage,
  deleteReaction,
  message,
  retrySendMessage,
  sendReaction,
  setEditingState,
  setQuotedMessage,
}: Pick<
  MessagesContextValue,
  'sendReaction' | 'deleteMessage' | 'deleteReaction' | 'retrySendMessage' | 'supportedReactions'
> &
  Pick<ChannelContextValue, 'channel' | 'enforceUniqueReaction'> &
  Pick<ChatContextValue, 'client'> &
  Pick<MessageContextValue, 'message'> &
  Pick<MessageComposerAPIContextValue, 'setEditingState' | 'setQuotedMessage'>) => {
  const { t } = useTranslationContext();
  const handleResendMessage = () => retrySendMessage(message);

  const handleQuotedReplyMessage = () => {
    setQuotedMessage(message);
  };

  const isMuted = (client.mutedUsers || []).some(
    (mute) => mute.user.id === client.userID && mute.target.id === message.user?.id,
  );

  const handleCopyMessage = () => {
    if (!message.text) {
      return;
    }
    NativeHandlers.setClipboardString(message.text);
  };

  const handleDeleteMessage = () => {
    if (!message.id) {
      return;
    }
    Alert.alert(
      t('Delete Message'),
      t('Are you sure you want to permanently delete this message?'),
      [
        { style: 'cancel', text: t('Cancel') },
        {
          onPress: async () => {
            await deleteMessage(message);
          },
          style: 'destructive',
          text: t('Delete'),
        },
      ],
      { cancelable: false },
    );
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

  const handleFlagMessage = () => {
    if (!message.id) {
      return;
    }
    Alert.alert(
      t('Flag Message'),
      t('Do you want to send a copy of this message to a moderator for further investigation?'),
      [
        { style: 'cancel', text: t('Cancel') },
        {
          onPress: async () => {
            try {
              await client.flagMessage(message.id);
              Alert.alert(t('Message flagged'), t('The message has been reported to a moderator.'));
            } catch (error) {
              console.log('Error flagging message:', error);
              Alert.alert(
                t('Cannot Flag Message'),
                t(
                  'Flag action failed either due to a network issue or the message is already flagged',
                ),
              );
            }
          },
          text: t('Flag'),
        },
      ],
      { cancelable: false },
    );
  };

  const handleMarkUnreadMessage = async () => {
    if (!message.id) {
      return;
    }
    try {
      await channel.markUnread({ message_id: message.id });
    } catch (error) {
      console.log('Error marking message as unread:', error);
      Alert.alert(
        t(
          'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
        ),
      );
    }
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
          'message.own_reactions contained reactions from a different user, this indicates a bug',
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
    handleCopyMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleFlagMessage,
    handleMarkUnreadMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleTogglePinMessage,
    handleToggleReaction,
  };
};
