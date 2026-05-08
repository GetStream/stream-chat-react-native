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
import {
  useAfterKeyboardOpenCallback,
  usePortalSettledCallback,
  useStableCallback,
} from '../../../hooks';
import { useTranslatedMessage } from '../../../hooks/useTranslatedMessage';
import { NativeHandlers } from '../../../native';
import { useNotificationApi } from '../../Notifications';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getNotificationError = (error: unknown): Error | undefined => {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string') return new Error(message);
  }
  return undefined;
};

export const useWithPortalKeyboardSafety = <T extends unknown[]>(
  callback: (...args: T) => void,
) => {
  const callbackAfterKeyboardOpen = useAfterKeyboardOpenCallback(callback);

  return usePortalSettledCallback(callbackAfterKeyboardOpen);
};

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
  const { addNotification } = useNotificationApi();
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
            try {
              await deleteMessage(message);
              addNotification({
                context: { message },
                emitter: 'MessageActions',
                message: t('Message deleted'),
                severity: 'success',
                type: 'api:message:delete:success',
              });
            } catch (error) {
              addNotification({
                context: { message },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(error, t('Error deleting message')),
                severity: 'error',
                type: 'api:message:delete:failed',
              });
            }
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

    try {
      if (isMuted) {
        await client.unmuteUser(message.user.id);
        addNotification({
          context: { message },
          emitter: 'MessageActions',
          message: t('{{ user }} has been unmuted', {
            user: message.user?.name || message.user?.id,
          }),
          severity: 'success',
          type: 'api:user:unmute:success',
        });
      } else {
        await client.muteUser(message.user.id);
        addNotification({
          context: { message },
          emitter: 'MessageActions',
          message: t('{{ user }} has been muted', {
            user: message.user?.name || message.user?.id,
          }),
          severity: 'success',
          type: 'api:user:mute:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { message },
        emitter: 'MessageActions',
        error: getNotificationError(error),
        message: getErrorMessage(
          error,
          isMuted ? t('Error unmuting a user ...') : t('Error muting a user ...'),
        ),
        severity: 'error',
        type: isMuted ? 'api:user:unmute:failed' : 'api:user:mute:failed',
      });
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
    const isPinned = !!message.pinned;
    try {
      if (!isPinned) {
        await client.pinMessage(message, null);
        addNotification({
          context: { message },
          emitter: 'MessageActions',
          message: t('Message pinned'),
          severity: 'success',
          type: 'api:message:pin:success',
        });
      } else {
        await client.unpinMessage(message);
        addNotification({
          context: { message },
          emitter: 'MessageActions',
          message: t('Message unpinned'),
          severity: 'success',
          type: 'api:message:unpin:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { message },
        emitter: 'MessageActions',
        error: getNotificationError(error),
        message: getErrorMessage(
          error,
          isPinned ? t('Error removing message pin') : t('Error pinning message'),
        ),
        severity: 'error',
        type: isPinned ? 'api:message:unpin:failed' : 'api:message:pin:failed',
      });
    }
  });

  const handleEditMessage = useWithPortalKeyboardSafety(() => {
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
              addNotification({
                context: { message },
                emitter: 'MessageActions',
                message: t('Message has been successfully flagged'),
                severity: 'success',
                type: 'api:message:flag:success',
              });
            } catch (error) {
              addNotification({
                context: { message },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(error, t('Error adding flag')),
                severity: 'error',
                type: 'api:message:flag:failed',
              });
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
      addNotification({
        context: { message },
        emitter: 'MessageActions',
        message: t('Message marked as unread'),
        severity: 'success',
        type: 'api:message:markUnread:success',
      });
    } catch (error) {
      addNotification({
        context: { message },
        emitter: 'MessageActions',
        error: getNotificationError(error),
        message: getErrorMessage(
          error,
          t(
            'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
          ),
        ),
        severity: 'error',
        type: 'api:message:markUnread:failed',
      });
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
