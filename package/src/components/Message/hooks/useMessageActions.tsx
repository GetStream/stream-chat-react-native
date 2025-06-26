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
  Unpin,
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
    theme: {
      colors: { accent_red, grey },
    },
  } = useTheme();
  const {
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
    icon: <UserDelete pathFill={grey} />,
    title: message.user?.banned ? t('Unban User') : t('Ban User'),
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
    icon: <Copy pathFill={grey} />,
    title: t('Copy Message'),
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
    icon: <Delete fill={accent_red} size={24} />,
    title: t('Delete Message'),
    titleStyle: { color: accent_red },
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
    icon: <Edit pathFill={grey} />,
    title: t('Edit Message'),
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
    icon: <MessageFlag pathFill={grey} />,
    title: t('Flag Message'),
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
    icon: <UnreadIndicator fill={grey} size={24} />,
    title: t('Mark as Unread'),
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
    icon: <Pin pathFill={grey} size={24} />,
    title: t('Pin to Conversation'),
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
    icon: <Unpin pathFill={grey} />,
    title: t('Unpin from Conversation'),
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
    icon: <Mute pathFill={grey} />,
    title: isMuted ? t('Unmute User') : t('Mute User'),
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
    icon: <CurveLineLeftUp pathFill={grey} />,
    title: t('Reply'),
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
    icon: <Resend pathFill={grey} />,
    title: t('Resend'),
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
    icon: <ThreadReply pathFill={grey} />,
    title: t('Thread Reply'),
  };

  return {
    banUser,
    copyMessage,
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
