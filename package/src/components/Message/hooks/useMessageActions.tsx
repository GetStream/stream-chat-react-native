import React from 'react';

import { LocalMessage } from 'stream-chat';

import { useMessageActionHandlers } from './useMessageActionHandlers';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import { MessageComposerAPIContextValue } from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import {
  Copy,
  CurveLineLeftUp,
  Delete,
  Edit,
  MessageFlag,
  Mute,
  Pin,
  Resend,
  ThreadReply,
  // Unpin,
  UnreadIndicator,
  UserDelete,
} from '../../../icons';

import { removeReservedFields } from '../../../utils/removeReservedFields';
import { MessageStatusTypes } from '../../../utils/utils';

import type { MessageActionType } from '../../MessageMenu/MessageActionListItem';

export type MessageActionsHookProps = Pick<
  MessagesContextValue,
  | 'deleteMessage'
  | 'sendReaction'
  | 'handleBan'
  | 'handleCopy'
  | 'handleDelete'
  | 'handleDeleteForMe'
  | 'handleEdit'
  | 'handleFlag'
  | 'handleQuotedReply'
  | 'handleMarkUnread'
  | 'handleMute'
  | 'handlePinMessage'
  | 'handleRetry'
  | 'handleReaction'
  | 'handleThreadReply'
  | 'removeMessage'
  | 'deleteReaction'
  | 'retrySendMessage'
  | 'selectReaction'
  | 'supportedReactions'
  | 'updateMessage'
> &
  Pick<ChannelContextValue, 'channel' | 'enforceUniqueReaction'> &
  Pick<ChatContextValue, 'client'> &
  Pick<ThreadContextValue, 'openThread'> &
  Pick<MessageContextValue, 'dismissOverlay' | 'message'> &
  Pick<TranslationContextValue, 't'> & {
    onThreadSelect?: (message: LocalMessage) => void;
  } & Pick<MessageComposerAPIContextValue, 'setEditingState' | 'setQuotedMessage'>;

export const useMessageActions = ({
  channel,
  client,
  deleteMessage: deleteMessageFromContext,
  deleteReaction,
  dismissOverlay,
  enforceUniqueReaction,
  handleBan,
  handleCopy,
  handleDelete,
  handleDeleteForMe,
  handleEdit,
  handleFlag,
  handleMarkUnread,
  handleMute,
  handlePinMessage,
  handleQuotedReply,
  handleReaction: handleReactionProp,
  handleRetry,
  handleThreadReply,
  message,
  onThreadSelect,
  openThread,
  retrySendMessage,
  selectReaction,
  sendReaction,
  setEditingState,
  supportedReactions,
  t,
  setQuotedMessage,
}: MessageActionsHookProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const {
    handleCopyMessage,
    handleDeleteMessage,
    handleDeleteForMeMessage,
    handleEditMessage,
    handleFlagMessage,
    handleMarkUnreadMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleTogglePinMessage,
    handleToggleReaction,
  } = useMessageActionHandlers({
    channel,
    client,
    deleteMessage: deleteMessageFromContext,
    deleteReaction,
    enforceUniqueReaction,
    message,
    retrySendMessage,
    sendReaction,
    setEditingState,
    setQuotedMessage,
    supportedReactions,
  });

  const error = message.type === 'error' || message.status === MessageStatusTypes.FAILED;

  const onOpenThread = () => {
    if (onThreadSelect) {
      onThreadSelect(message);
    }
    if (openThread) {
      openThread(message);
    }
  };

  const isMuted = (client.mutedUsers || []).some(
    (mute) => mute.user.id === client.userID && mute.target.id === message.user?.id,
  );

  const banUser: MessageActionType = {
    action: async () => {
      dismissOverlay();
      if (message.user?.id) {
        if (handleBan) {
          handleBan(message);
        }

        await handleToggleBanUser();
      }
    },
    actionType: 'banUser',
    icon: <UserDelete width={20} height={20} stroke={semantics.textSecondary} />,
    title: message.user?.banned ? t('Unban User') : t('Ban User'),
    type: 'destructive',
  };

  const copyMessage: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleCopy) {
        handleCopy(message);
      }
      handleCopyMessage();
    },
    actionType: 'copyMessage',
    icon: <Copy width={20} height={20} stroke={semantics.textSecondary} />,
    title: t('Copy Message'),
    type: 'standard',
  };

  const deleteMessage: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleDelete) {
        handleDelete(message);
      }
      handleDeleteMessage();
    },
    actionType: 'deleteMessage',
    icon: <Delete stroke={semantics.accentError} width={20} height={20} />,
    title: t('Delete Message'),
    titleStyle: { color: semantics.accentError },
    type: 'destructive',
  };

  const deleteForMeMessage: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleDeleteForMe) {
        handleDeleteForMe(message);
      }
      handleDeleteForMeMessage();
    },
    actionType: 'deleteForMeMessage',
    icon: <Delete stroke={semantics.accentError} width={20} height={20} />,
    title: t('Delete for me'),
    titleStyle: { color: semantics.accentError },
    type: 'destructive',
  };

  const editMessage: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleEdit) {
        handleEdit(message);
      }
      handleEditMessage();
    },
    actionType: 'editMessage',
    icon: <Edit width={20} height={20} stroke={semantics.textSecondary} />,
    title: t('Edit Message'),
    type: 'standard',
  };

  const flagMessage: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleFlag) {
        handleFlag(message);
      }
      handleFlagMessage();
    },
    actionType: 'flagMessage',
    icon: <MessageFlag width={20} height={20} stroke={semantics.textSecondary} />,
    title: t('Flag Message'),
    type: 'standard',
  };

  const markUnread: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleMarkUnread) {
        handleMarkUnread(message);
      }
      handleMarkUnreadMessage();
    },
    actionType: 'markUnread',
    icon: <UnreadIndicator width={20} height={20} stroke={semantics.textSecondary} />,
    title: t('Mark as Unread'),
    type: 'standard',
  };

  const pinMessage: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handlePinMessage) {
        handlePinMessage(message);
      }
      handleTogglePinMessage();
    },
    actionType: 'pinMessage',
    icon: <Pin width={20} height={20} stroke={semantics.textSecondary} />,
    title: t('Pin to Conversation'),
    type: 'standard',
  };

  const unpinMessage: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handlePinMessage) {
        handlePinMessage(message);
      }
      handleTogglePinMessage();
    },
    actionType: 'unpinMessage',
    // TODO: V9: This icon does not exist yet, replace the old when when we get a new one
    icon: <Pin width={20} height={20} stroke={semantics.textSecondary} />,
    title: t('Unpin from Conversation'),
    type: 'standard',
  };

  const handleReaction = !error
    ? selectReaction
      ? selectReaction(message)
      : async (reactionType: string) => {
          if (handleReactionProp) {
            handleReactionProp(message, reactionType);
          }

          await handleToggleReaction(reactionType);
        }
    : undefined;

  const muteUser: MessageActionType = {
    action: async () => {
      dismissOverlay();
      if (message.user?.id) {
        if (handleMute) {
          handleMute(message);
        }

        await handleToggleMuteUser();
      }
    },
    actionType: 'muteUser',
    icon: <Mute fill={semantics.textSecondary} height={20} width={20} />,
    title: isMuted ? t('Unmute User') : t('Mute User'),
    type: 'standard',
  };

  const quotedReply: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleQuotedReply) {
        handleQuotedReply(message);
      }
      handleQuotedReplyMessage();
    },
    actionType: 'quotedReply',
    icon: <CurveLineLeftUp stroke={semantics.textSecondary} height={20} width={20} />,
    title: t('Reply'),
    type: 'standard',
  };

  const retry: MessageActionType = {
    action: async () => {
      dismissOverlay();
      const messageWithoutReservedFields = removeReservedFields(message);
      if (handleRetry) {
        handleRetry(messageWithoutReservedFields as LocalMessage);
      }

      await handleResendMessage();
    },
    actionType: 'retry',
    icon: <Resend stroke={semantics.textSecondary} height={20} width={20} />,
    title: t('Resend'),
    type: 'standard',
  };

  const threadReply: MessageActionType = {
    action: () => {
      dismissOverlay();
      if (handleThreadReply) {
        handleThreadReply(message);
      }
      onOpenThread();
    },
    actionType: 'threadReply',
    icon: <ThreadReply stroke={semantics.textSecondary} height={20} width={20} />,
    title: t('Thread Reply'),
    type: 'standard',
  };

  return {
    banUser,
    copyMessage,
    deleteForMeMessage,
    deleteMessage,
    editMessage,
    flagMessage,
    handleReaction,
    markUnread,
    muteUser,
    pinMessage,
    quotedReply,
    retry,
    threadReply,
    unpinMessage,
  };
};
