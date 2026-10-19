import { useMemo } from 'react';
import { Alert } from 'react-native';

import type { Channel, LocalMessage, StreamChat, UserResponse } from 'stream-chat';

import { MessageOperations } from './useMessageOperations';
import { isUserMuted } from './useUserMuteActive';

import { useScreenReaderEnabled } from '../../../a11y/hooks/useScreenReaderEnabled';
import { MessageComposerAPIContextValue } from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import {
  useAfterKeyboardOpenCallback,
  usePortalSettledCallback,
  useStableCallback,
} from '../../../hooks';
import { getTranslatedMessage } from '../../../hooks/useTranslatedMessage';
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

const getNotificationErrorOptions = (error: unknown) => {
  const originalError = getNotificationError(error);
  return originalError ? { originalError } : {};
};

export const useWithPortalKeyboardSafety = <T extends unknown[]>(
  callback: (...args: T) => void,
) => {
  const callbackAfterKeyboardOpen = useAfterKeyboardOpenCallback(callback);

  return usePortalSettledCallback(callbackAfterKeyboardOpen);
};

export type MessageActionHandlerCallbacks = {
  handleCopyMessage: () => void;
  handleDeleteForMeMessage: () => Promise<void>;
  handleDeleteMessage: () => void;
  handleEditMessage: () => void;
  handleFlagMessage: () => void;
  handleMarkUnreadMessage: () => Promise<void>;
  handleQuotedReplyMessage: () => void;
  handleResendMessage: () => Promise<void>;
  handleToggleBanUser: () => Promise<void>;
  handleToggleBlockUser: (user: UserResponse | null | undefined) => Promise<void>;
  handleToggleMuteUser: () => Promise<void>;
  handleTogglePinMessage: () => Promise<void>;
  handleToggleReaction: (reactionType: string) => Promise<void>;
};

export type CreateMessageActionHandlersParams = Pick<
  MessageOperations,
  'sendReaction' | 'deleteMessage' | 'deleteReaction' | 'retrySendMessage'
> &
  Pick<MessageComposerAPIContextValue, 'setEditingState' | 'setQuotedMessage'> & {
    channel: Channel;
    client: StreamChat;
    message: LocalMessage;
  };

/**
 * Builds the handlers behind the message actions. Holds no subscriptions: anything the handlers
 * branch on (mute, ban and block state, the translated text) is read when the handler runs.
 */
export const useCreateMessageActionHandlers = ({
  channel,
  client,
  deleteMessage,
  deleteReaction,
  message,
  retrySendMessage,
  sendReaction,
  setEditingState,
  setQuotedMessage,
}: CreateMessageActionHandlersParams): MessageActionHandlerCallbacks => {
  const { t, userLanguage } = useTranslationContext();
  const { addNotification } = useNotificationApi();
  const { inputBoxRef } = useMessageInputContext();
  const screenReaderEnabled = useScreenReaderEnabled();
  const handleResendMessage = useStableCallback(() => retrySendMessage(message));

  const handleQuotedReplyMessage = useStableCallback(() => {
    setQuotedMessage(message);
    if (screenReaderEnabled) {
      inputBoxRef.current?.focus();
    }
  });

  const handleCopyMessage = useStableCallback(() => {
    if (!message.text) {
      return;
    }
    const translatedMessage = getTranslatedMessage(message, userLanguage);
    NativeHandlers.setClipboardString(translatedMessage?.text ?? message.text, {
      onFailure: (error) => {
        addNotification({
          message: t('message.copyMessage.error', 'Failed to copy message'),
          options: {
            ...getNotificationErrorOptions(error),
            severity: 'error',
            type: 'clipboard:message:copy:failed',
          },
          origin: { context: { message }, emitter: 'MessageActions' },
        });
      },
      onSuccess: () => {
        addNotification({
          message: t('message.copied.text', 'Message copied to clipboard'),
          options: { severity: 'success', type: 'clipboard:message:copy:success' },
          origin: { context: { message }, emitter: 'MessageActions' },
        });
      },
    });
  });

  const handleDeleteMessage = useStableCallback(() => {
    if (!message.id) {
      return;
    }
    Alert.alert(
      t('message.deleteMessage.label', 'Delete Message'),
      t(
        'message.deleteMessageConfirm.text',
        'Are you sure you want to permanently delete this message?',
      ),
      [
        { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
        {
          onPress: async () => {
            try {
              await deleteMessage(message);
              addNotification({
                message: t('message.deleted.text', 'Message deleted'),
                options: { severity: 'success', type: 'api:message:delete:success' },
                origin: { context: { message }, emitter: 'MessageActions' },
              });
            } catch (error) {
              addNotification({
                message: getErrorMessage(
                  error,
                  t('message.deleteMessage.error', 'Error deleting message'),
                ),
                options: {
                  ...getNotificationErrorOptions(error),
                  severity: 'error',
                  type: 'api:message:delete:failed',
                },
                origin: { context: { message }, emitter: 'MessageActions' },
              });
            }
          },
          style: 'destructive',
          text: t('message.deleteMessageConfirm.label', 'Delete'),
        },
      ],
      { cancelable: false },
    );
  });

  const handleDeleteForMeMessage = useStableCallback(async () => {
    if (!message.id) {
      return;
    }

    await deleteMessage(message, { delete_for_me: true });
  });

  const handleToggleMuteUser = useStableCallback(async () => {
    if (!message.user?.id) {
      return;
    }

    const isMuted = isUserMuted(
      client.mutedUsersStore.getLatestValue().mutedUsers,
      client.userID,
      message.user.id,
    );

    try {
      if (isMuted) {
        await client.moderation.unmute({ target_ids: [message.user.id] });
        addNotification({
          message: t('message.userUnmuted.text', '{{ user }} has been unmuted', {
            user: message.user?.name || message.user?.id,
          }),
          options: { severity: 'success', type: 'api:user:unmute:success' },
          origin: { context: { message }, emitter: 'MessageActions' },
        });
      } else {
        await client.moderation.mute({ target_ids: [message.user.id] });
        addNotification({
          message: t('message.userMuted.text', '{{ user }} has been muted', {
            user: message.user?.name || message.user?.id,
          }),
          options: { severity: 'success', type: 'api:user:mute:success' },
          origin: { context: { message }, emitter: 'MessageActions' },
        });
      }
    } catch (error) {
      addNotification({
        message: getErrorMessage(
          error,
          isMuted
            ? t('message.unmuteUser.error', 'Error unmuting a user ...')
            : t('message.muteUser.error', 'Error muting a user ...'),
        ),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: isMuted ? 'api:user:unmute:failed' : 'api:user:mute:failed',
        },
        origin: { context: { message }, emitter: 'MessageActions' },
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
      await client.moderation.ban({ target_user_id: messageUser.id });
    }
  });

  const handleTogglePinMessage = useStableCallback(async () => {
    const isPinned = !!message.pinned;
    try {
      if (!isPinned) {
        await client.pinMessage(message);
        addNotification({
          message: t('message.pinned.text', 'Message pinned'),
          options: { severity: 'success', type: 'api:message:pin:success' },
          origin: { context: { message }, emitter: 'MessageActions' },
        });
      } else {
        await client.unpinMessage(message);
        addNotification({
          message: t('message.unpinned.text', 'Message unpinned'),
          options: { severity: 'success', type: 'api:message:unpin:success' },
          origin: { context: { message }, emitter: 'MessageActions' },
        });
      }
    } catch (error) {
      addNotification({
        message: getErrorMessage(
          error,
          isPinned
            ? t('message.unpinMessage.error', 'Error removing message pin')
            : t('message.pinMessage.error', 'Error pinning message'),
        ),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: isPinned ? 'api:message:unpin:failed' : 'api:message:pin:failed',
        },
        origin: { context: { message }, emitter: 'MessageActions' },
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
      t('message.flagMessage.label', 'Flag Message'),
      t(
        'message.flagMessageConfirm.text',
        'Do you want to send a copy of this message to a moderator for further investigation?',
      ),
      [
        { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
        {
          onPress: async () => {
            try {
              await client.moderation.flagMessage({ message_id: message.id });
              addNotification({
                message: t('message.flagged.text', 'Message has been successfully flagged'),
                options: { severity: 'success', type: 'api:message:flag:success' },
                origin: { context: { message }, emitter: 'MessageActions' },
              });
            } catch (error) {
              addNotification({
                message: getErrorMessage(
                  error,
                  t('message.flagMessage.error', 'Error adding flag'),
                ),
                options: {
                  ...getNotificationErrorOptions(error),
                  severity: 'error',
                  type: 'api:message:flag:failed',
                },
                origin: { context: { message }, emitter: 'MessageActions' },
              });
            }
          },
          text: t('message.flagMessageConfirm.label', 'Flag'),
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
        message: t('message.markedUnread.text', 'Message marked as unread'),
        options: { severity: 'success', type: 'api:message:markUnread:success' },
        origin: { context: { message }, emitter: 'MessageActions' },
      });
    } catch (error) {
      addNotification({
        message: getErrorMessage(
          error,
          t(
            'message.markUnreadTooOld.error',
            'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
          ),
        ),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:message:markUnread:failed',
        },
        origin: { context: { message }, emitter: 'MessageActions' },
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
        await client.unblockUser(user.id);
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
