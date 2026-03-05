import { useMemo } from 'react';
import { Alert } from 'react-native';

import { UserResponse } from 'stream-chat';

import { useUserMuteActive } from './useUserMuteActive';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import { MessageComposerAPIContextValue } from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks';
import { useTranslatedMessage } from '../../../hooks/useTranslatedMessage';
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
  const handleResendMessage = useStableCallback(() => retrySendMessage(message));
  const translatedMessage = useTranslatedMessage(message);

  const isMuted = useUserMuteActive(message.user);

  const handleQuotedReplyMessage = useStableCallback(() => {
    setQuotedMessage(message);
  });

  const handleCopyMessage = useStableCallback(() => {
    if (!message.text) {
      return;
    }
    NativeHandlers.setClipboardString(translatedMessage?.text ?? message.text);
  });

  const handleDeleteMessage = useStableCallback(() => {
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
  });

  const handleDeleteForMeMessage = useStableCallback(async () => {
    if (!message.id) {
      return;
    }

    await deleteMessage(message, { deleteForMe: true });
  });

  const handleToggleMuteUser = useStableCallback(async () => {
    if (!message.user?.id) {
      return;
    }

    if (isMuted) {
      await client.unmuteUser(message.user.id);
    } else {
      await client.muteUser(message.user.id);
    }
  });

  const handleToggleBanUser = useStableCallback(async () => {
    const messageUser = message.user;
    if (!messageUser) {
      return;
    }

    if (messageUser.banned) {
      await client.unbanUser(messageUser.id);
    } else {
      await client.banUser(messageUser.id);
    }
  });

  const handleTogglePinMessage = useStableCallback(async () => {
    const MessagePinnedHeaderStatus = message.pinned;
    if (!MessagePinnedHeaderStatus) {
      await client.pinMessage(message, null);
    } else {
      await client.unpinMessage(message);
    }
  });

  const handleEditMessage = useStableCallback(() => {
    setEditingState(message);
  });

  const handleFlagMessage = useStableCallback(() => {
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
  });

  const handleMarkUnreadMessage = useStableCallback(async () => {
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
  });

  const handleToggleReaction = useStableCallback(async (reactionType: string) => {
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
  });

  const handleToggleBlockUser = useStableCallback(async (user: UserResponse | null | undefined) => {
    try {
      if (!user) {
        return;
      }
      const isBlocked = new Set(client.blockedUsers.getLatestValue().userIds).has(user?.id ?? '');
      if (isBlocked) {
        await client.unBlockUser(user.id);
      } else {
        await client.blockUser(user.id);
      }
    } catch (err) {
      console.log(err);
    }
  });

  return useMemo(
    () => ({
      handleCopyMessage,
      handleDeleteForMeMessage,
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
      handleToggleBlockUser,
    }),
    [
      handleCopyMessage,
      handleDeleteForMeMessage,
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
      handleToggleBlockUser,
    ],
  );
};
