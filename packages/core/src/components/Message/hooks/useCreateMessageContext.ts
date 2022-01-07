import { useMemo } from 'react';

import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
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
import { isMessageWithStylesReadByAndDateSeparator } from '../../MessageList/hooks/useMessageList';

export const useCreateMessageContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
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
}: MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const groupStylesLength = groupStyles.length;
  const reactionsValue = reactions.map(({ own, type }) => `${own}${type}`).join();
  const latestReactions = message.latest_reactions ? message.latest_reactions : undefined;
  const readBy = isMessageWithStylesReadByAndDateSeparator(message) && message.readBy;
  const messageValue = `${latestReactions ? latestReactions.map(({ type }) => type).join() : ''}${
    message.updated_at
  }${message.deleted_at}${readBy}${message.status}${message.type}${message.text}${
    message.reply_count
  }`;
  const membersValue = JSON.stringify(members);

  const quotedMessageDeletedValue = message.quoted_message?.deleted_at;

  const messageContext: MessageContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
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
