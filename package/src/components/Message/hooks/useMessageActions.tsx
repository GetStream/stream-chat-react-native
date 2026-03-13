import React, { useMemo } from 'react';

import { LocalMessage } from 'stream-chat';

import { useMessageActionHandlers } from './useMessageActionHandlers';

import { useUserMuteActive } from './useUserMuteActive';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import { MessageComposerAPIContextValue } from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks';
import {
  BlockUser,
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
  | 'handleBlockUser'
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
  handleBlockUser,
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
    handleToggleBlockUser,
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

  const onOpenThread = useStableCallback(() => {
    if (onThreadSelect) {
      onThreadSelect(message);
    }
    if (openThread) {
      openThread(message);
    }
  });

  const onBanUser = useStableCallback(async () => {
    if (message.user?.id) {
      if (handleBan) {
        handleBan(message);
      }

      await handleToggleBanUser();
    }
  });

  const onCopyMessage = useStableCallback(() => {
    //
    if (handleCopy) {
      handleCopy(message);
    }
    handleCopyMessage();
  });

  const onDeleteMessage = useStableCallback(() => {
    if (handleDelete) {
      handleDelete(message);
    }
    handleDeleteMessage();
  });

  const onDeleteForMeMessage = useStableCallback(() => {
    if (handleDeleteForMe) {
      handleDeleteForMe(message);
    }
    handleDeleteForMeMessage();
  });

  const onEditMessage = useStableCallback(() => {
    if (handleEdit) {
      handleEdit(message);
    }
    handleEditMessage();
  });

  const onFlagMessage = useStableCallback(() => {
    if (handleFlag) {
      handleFlag(message);
    }
    handleFlagMessage();
  });

  const onMarkUnread = useStableCallback(() => {
    if (handleMarkUnread) {
      handleMarkUnread(message);
    }
    handleMarkUnreadMessage();
  });

  const onTogglePinMessage = useStableCallback(() => {
    if (handlePinMessage) {
      handlePinMessage(message);
    }
    handleTogglePinMessage();
  });

  const onReaction = useStableCallback(async (reactionType: string) => {
    if (handleReactionProp) {
      handleReactionProp(message, reactionType);
    }

    await handleToggleReaction(reactionType);
  });

  const onMuteUser = useStableCallback(async () => {
    if (message.user?.id) {
      if (handleMute) {
        handleMute(message);
      }

      await handleToggleMuteUser();
    }
  });

  const onQuotedReply = useStableCallback(() => {
    if (handleQuotedReply) {
      handleQuotedReply(message);
    }
    handleQuotedReplyMessage();
  });

  const onRetry = useStableCallback(async () => {
    const messageWithoutReservedFields = removeReservedFields(message);
    if (handleRetry) {
      handleRetry(messageWithoutReservedFields as LocalMessage);
    }

    await handleResendMessage();
  });

  const onThreadReply = useStableCallback(() => {
    if (handleThreadReply) {
      handleThreadReply(message);
    }
    onOpenThread();
  });

  const onBlockUser = useStableCallback(() => {
    if (handleBlockUser) {
      handleBlockUser(message.user);
    }

    handleToggleBlockUser(message.user);
  });

  const isMuted = useUserMuteActive(message.user);
  const isBlocked = new Set(client.blockedUsers.getLatestValue().userIds).has(
    message.user?.id ?? '',
  );

  return useMemo(() => {
    const handleReaction =
      !error && !selectReaction ? onReaction : !error ? selectReaction?.(message) : undefined;

    const banUser: MessageActionType = {
      action: onBanUser,
      actionType: 'banUser',
      icon: <UserDelete width={20} height={20} stroke={semantics.accentError} />,
      title: message.user?.banned ? t('Unban User') : t('Ban User'),
      titleStyle: { color: semantics.accentError },
      type: 'destructive',
    };

    const copyMessage: MessageActionType = {
      action: onCopyMessage,
      actionType: 'copyMessage',
      icon: <Copy width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('Copy Message'),
      type: 'standard',
    };

    const deleteMessage: MessageActionType = {
      action: onDeleteMessage,
      actionType: 'deleteMessage',
      icon: <Delete stroke={semantics.accentError} width={20} height={20} />,
      title: t('Delete Message'),
      titleStyle: { color: semantics.accentError },
      type: 'destructive',
    };

    const deleteForMeMessage: MessageActionType = {
      action: onDeleteForMeMessage,
      actionType: 'deleteForMeMessage',
      icon: <Delete stroke={semantics.accentError} width={20} height={20} />,
      title: t('Delete for me'),
      titleStyle: { color: semantics.accentError },
      type: 'destructive',
    };

    const editMessage: MessageActionType = {
      action: onEditMessage,
      actionType: 'editMessage',
      icon: <Edit width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('Edit Message'),
      type: 'standard',
    };

    const flagMessage: MessageActionType = {
      action: onFlagMessage,
      actionType: 'flagMessage',
      icon: <MessageFlag width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('Flag Message'),
      type: 'standard',
    };

    const markUnread: MessageActionType = {
      action: onMarkUnread,
      actionType: 'markUnread',
      icon: <UnreadIndicator width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('Mark as Unread'),
      type: 'standard',
    };

    const pinMessage: MessageActionType = {
      action: onTogglePinMessage,
      actionType: 'pinMessage',
      icon: <Pin width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('Pin to Conversation'),
      type: 'standard',
    };

    const unpinMessage: MessageActionType = {
      action: onTogglePinMessage,
      actionType: 'unpinMessage',
      // TODO: V9: This icon does not exist yet, replace the old when when we get a new one
      icon: <Pin width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('Unpin from Conversation'),
      type: 'standard',
    };

    const muteUser: MessageActionType = {
      action: onMuteUser,
      actionType: 'muteUser',
      icon: <Mute fill={semantics.textSecondary} height={20} width={20} />,
      title: isMuted ? t('Unmute User') : t('Mute User'),
      type: 'standard',
    };

    const quotedReply: MessageActionType = {
      action: onQuotedReply,
      actionType: 'quotedReply',
      icon: <CurveLineLeftUp stroke={semantics.textSecondary} height={20} width={20} />,
      title: t('Reply'),
      type: 'standard',
    };

    const retry: MessageActionType = {
      action: onRetry,
      actionType: 'retry',
      icon: <Resend stroke={semantics.textSecondary} height={20} width={20} />,
      title: t('Resend'),
      type: 'standard',
    };

    const threadReply: MessageActionType = {
      action: onThreadReply,
      actionType: 'threadReply',
      icon: <ThreadReply stroke={semantics.textSecondary} height={20} width={20} />,
      title: t('Thread Reply'),
      type: 'standard',
    };

    const blockUser: MessageActionType = {
      action: onBlockUser,
      actionType: 'blockUser',
      icon: <BlockUser stroke={semantics.accentError} height={20} width={20} />,
      title: isBlocked ? t('Unblock User') : t('Block User'),
      titleStyle: { color: semantics.accentError },
      type: 'destructive',
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
      blockUser,
    };
  }, [
    error,
    isBlocked,
    isMuted,
    message,
    onBanUser,
    onBlockUser,
    onCopyMessage,
    onDeleteForMeMessage,
    onDeleteMessage,
    onEditMessage,
    onFlagMessage,
    onMarkUnread,
    onMuteUser,
    onQuotedReply,
    onReaction,
    onRetry,
    onThreadReply,
    onTogglePinMessage,
    selectReaction,
    semantics.accentError,
    semantics.textSecondary,
    t,
  ]);
};
