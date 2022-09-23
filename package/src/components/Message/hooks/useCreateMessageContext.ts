import { useMemo } from 'react';

import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { isMessageWithStylesReadByAndDateSeparator } from '../../MessageList/hooks/useMessageList';

export const useCreateMessageContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  actionsEnabled,
  alignment,
  channel,
  disabled,
  files,
  goToMessage,
  groupStyles,
  handleAction,
  handleDeleteMessage,
  handleEditMessage,
  handleQuotedReplyMessage,
  handleResendMessage,
  handleToggleBanUser,
  handleToggleMuteUser,
  handleToggleReaction,
  hasReactions,
  images,
  isMyMessage,
  lastGroupMessage,
  lastReceivedId,
  members,
  message,
  messageContentOrder,
  onLongPress,
  onlyEmojis,
  onOpenThread,
  onPress,
  onPressIn,
  otherAttachments,
  preventPress,
  reactions,
  showAvatar,
  showMessageOverlay,
  showMessageStatus,
  threadList,
  videos,
}: MessageContextValue<StreamChatGenerics>) => {
  const groupStylesLength = groupStyles.length;
  const reactionsValue = reactions.map(({ own, type }) => `${own}${type}`).join();
  const latestReactions = message.latest_reactions ? message.latest_reactions : undefined;
  const readBy = isMessageWithStylesReadByAndDateSeparator(message) && message.readBy;
  const messageValue = `${
    latestReactions ? latestReactions.map(({ type, user }) => `${type}${user?.id}`).join() : ''
  }${message.updated_at}${message.deleted_at}${readBy}${message.status}${message.type}${
    message.text
  }${message.reply_count}`;
  const membersValue = JSON.stringify(members);

  const quotedMessageDeletedValue = message.quoted_message?.deleted_at;

  const messageContext: MessageContextValue<StreamChatGenerics> = useMemo(
    () => ({
      actionsEnabled,
      alignment,
      channel,
      disabled,
      files,
      goToMessage,
      groupStyles,
      handleAction,
      handleDeleteMessage,
      handleEditMessage,
      handleQuotedReplyMessage,
      handleResendMessage,
      handleToggleBanUser,
      handleToggleMuteUser,
      handleToggleReaction,
      hasReactions,
      images,
      isMyMessage,
      lastGroupMessage,
      lastReceivedId,
      members,
      message,
      messageContentOrder,
      onLongPress,
      onlyEmojis,
      onOpenThread,
      onPress,
      onPressIn,
      otherAttachments,
      preventPress,
      reactions,
      showAvatar,
      showMessageOverlay,
      showMessageStatus,
      threadList,
      videos,
    }),
    [
      actionsEnabled,
      quotedMessageDeletedValue,
      alignment,
      disabled,
      goToMessage,
      groupStylesLength,
      hasReactions,
      lastGroupMessage,
      lastReceivedId,
      membersValue,
      messageValue,
      reactionsValue,
      showAvatar,
      showMessageStatus,
      threadList,
    ],
  );

  return messageContext;
};
