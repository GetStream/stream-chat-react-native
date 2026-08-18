import React, { useMemo } from 'react';
import { Alert } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { useMessageActionHandlers } from './useMessageActionHandlers';
import { MessageOperations } from './useMessageOperations';

import { useUserMuteActive } from './useUserMuteActive';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { MessageComposerAPIContextValue } from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks';

import { removeReservedFields } from '../../../utils/removeReservedFields';
import { MessageStatusTypes } from '../../../utils/utils';

import type { MessageActionType } from '../../MessageMenu/MessageActionListItem';

export type MessageActionsHookProps = Pick<
  MessageOperations,
  | 'deleteMessage'
  | 'sendReaction'
  | 'removeMessage'
  | 'deleteReaction'
  | 'retrySendMessage'
  | 'updateMessage'
> &
  Pick<
    MessagesContextValue,
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
    | 'selectReaction'
    | 'supportedReactions'
  > &
  Pick<ChannelContextValue, 'channel' | 'enforceUniqueReaction'> &
  Pick<ChatContextValue, 'client'> &
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
  const { icons } = useComponentsContext();
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
      handleRetry(messageWithoutReservedFields);
    }

    await handleResendMessage();
  });

  const onThreadReply = useStableCallback(() => {
    if (handleThreadReply) {
      handleThreadReply(message);
    }
    onOpenThread();
  });

  const isMuted = useUserMuteActive(message.user);
  const isBlocked = new Set(client.blockedUsers.getLatestValue().userIds).has(
    message.user?.id ?? '',
  );

  const onBlockUser = useStableCallback(() => {
    if (handleBlockUser) {
      handleBlockUser(message.user);
    }

    if (isBlocked) {
      handleToggleBlockUser(message.user);
      return;
    }

    const name = message.user?.name || message.user?.id || '';

    Alert.alert(
      t('message.blockUserConfirm.title', 'Block {{ name }}', { name }),
      t(
        'message.blockUserConfirm.text',
        "They won't be able to message or call you. You can unblock them later.",
      ),
      [
        {
          style: 'cancel',
          text: t('common.cancel.label', 'Cancel'),
        },
        {
          onPress: () => {
            handleToggleBlockUser(message.user);
          },
          style: 'destructive',
          text: t('message.blockUserConfirm.label', 'Block'),
        },
      ],
    );
  });

  return useMemo(() => {
    const handleReaction =
      !error && !selectReaction ? onReaction : !error ? selectReaction?.(message) : undefined;

    const banUser: MessageActionType = {
      action: onBanUser,
      actionType: 'banUser',
      icon: <icons.UserDelete width={20} height={20} stroke={semantics.accentError} />,
      title: message.user?.banned
        ? t('message.unbanUser.label', 'Unban User')
        : t('message.banUser.label', 'Ban User'),
      titleStyle: { color: semantics.accentError },
      type: 'destructive',
    };

    const copyMessage: MessageActionType = {
      action: onCopyMessage,
      actionType: 'copyMessage',
      icon: <icons.Copy width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('message.copyMessage.label', 'Copy Message'),
      type: 'standard',
    };

    const deleteMessage: MessageActionType = {
      action: onDeleteMessage,
      actionType: 'deleteMessage',
      icon: <icons.Delete stroke={semantics.accentError} width={20} height={20} />,
      title: t('message.deleteMessage.label', 'Delete Message'),
      titleStyle: { color: semantics.accentError },
      type: 'destructive',
    };

    const deleteForMeMessage: MessageActionType = {
      action: onDeleteForMeMessage,
      actionType: 'deleteForMeMessage',
      icon: <icons.Delete stroke={semantics.accentError} width={20} height={20} />,
      title: t('message.deleteForMe.label', 'Delete for me'),
      titleStyle: { color: semantics.accentError },
      type: 'destructive',
    };

    const editMessage: MessageActionType = {
      action: onEditMessage,
      actionType: 'editMessage',
      icon: <icons.Edit width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('message.editMessage.label', 'Edit Message'),
      type: 'standard',
    };

    const flagMessage: MessageActionType = {
      action: onFlagMessage,
      actionType: 'flagMessage',
      icon: <icons.MessageFlag width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('message.flagMessage.label', 'Flag Message'),
      type: 'standard',
    };

    const markUnread: MessageActionType = {
      action: onMarkUnread,
      actionType: 'markUnread',
      icon: <icons.UnreadIndicator width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('message.markUnread.label', 'Mark as Unread'),
      type: 'standard',
    };

    const pinMessage: MessageActionType = {
      action: onTogglePinMessage,
      actionType: 'pinMessage',
      icon: <icons.Pin width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('message.pinMessage.label', 'Pin to Conversation'),
      type: 'standard',
    };

    const unpinMessage: MessageActionType = {
      action: onTogglePinMessage,
      actionType: 'unpinMessage',
      icon: <icons.Unpin width={20} height={20} stroke={semantics.textSecondary} />,
      title: t('message.unpinMessage.label', 'Unpin from Conversation'),
      type: 'standard',
    };

    const muteUser: MessageActionType = {
      action: onMuteUser,
      actionType: 'muteUser',
      icon: isMuted ? (
        <icons.Sound height={20} stroke={semantics.textSecondary} width={20} />
      ) : (
        <icons.Mute fill={semantics.textSecondary} height={20} width={20} />
      ),
      title: isMuted
        ? t('message.unmuteUser.label', 'Unmute User')
        : t('message.muteUser.label', 'Mute User'),
      type: 'standard',
    };

    const quotedReply: MessageActionType = {
      action: onQuotedReply,
      actionType: 'quotedReply',
      icon: <icons.CurveLineLeftUp stroke={semantics.textSecondary} height={20} width={20} />,
      title: t('message.reply.label', 'Reply'),
      type: 'standard',
    };

    const retry: MessageActionType = {
      action: onRetry,
      actionType: 'retry',
      icon: <icons.Resend stroke={semantics.textSecondary} height={20} width={20} />,
      title: t('message.resend.label', 'Resend'),
      type: 'standard',
    };

    const threadReply: MessageActionType = {
      action: onThreadReply,
      actionType: 'threadReply',
      icon: <icons.ThreadReply stroke={semantics.textSecondary} height={20} width={20} />,
      title: t('message.threadReply.label', 'Thread Reply'),
      type: 'standard',
    };

    const blockUser: MessageActionType = {
      action: onBlockUser,
      actionType: 'blockUser',
      icon: <icons.BlockUser stroke={semantics.accentError} height={20} width={20} />,
      title: isBlocked
        ? t('message.unblockUser.label', 'Unblock User')
        : t('message.blockUser.label', 'Block User'),
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
    icons,
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
