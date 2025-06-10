import { useMemo } from 'react';

import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';

import { stringifyMessage } from '../../../utils/utils';

export const useCreateMessageContext = ({
  actionsEnabled,
  alignment,
  channel,
  dismissOverlay,
  files,
  goToMessage,
  groupStyles,
  handleAction,
  handleReaction,
  handleToggleReaction,
  hasReactions,
  images,
  isEditedMessageOpen,
  isMessageAIGenerated,
  isMyMessage,
  lastGroupMessage,
  lastReceivedId,
  members,
  message,
  messageContentOrder,
  myMessageTheme,
  onLongPress,
  onlyEmojis,
  onOpenThread,
  onPress,
  onPressIn,
  otherAttachments,
  preventPress,
  reactions,
  readBy,
  setIsEditedMessageOpen,
  showAvatar,
  showMessageOverlay,
  showMessageStatus,
  threadList,
  videos,
  setQuotedMessage,
}: MessageContextValue) => {
  const groupStylesLength = groupStyles.length;
  const reactionsValue = reactions.map(({ count, own, type }) => `${own}${type}${count}`).join();
  const stringifiedMessage = stringifyMessage({ message });

  const membersValue = JSON.stringify(members);
  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

  const stringifiedQuotedMessage = message.quoted_message
    ? stringifyMessage({ includeReactions: false, message: message.quoted_message })
    : '';

  const messageContext: MessageContextValue = useMemo(
    () => ({
      actionsEnabled,
      alignment,
      channel,
      dismissOverlay,
      files,
      goToMessage,
      groupStyles,
      handleAction,
      handleReaction,
      handleToggleReaction,
      hasReactions,
      images,
      isEditedMessageOpen,
      isMessageAIGenerated,
      isMyMessage,
      lastGroupMessage,
      lastReceivedId,
      members,
      message,
      messageContentOrder,
      myMessageTheme,
      onLongPress,
      onlyEmojis,
      onOpenThread,
      onPress,
      onPressIn,
      otherAttachments,
      preventPress,
      reactions,
      readBy,
      setIsEditedMessageOpen,
      setQuotedMessage,
      showAvatar,
      showMessageOverlay,
      showMessageStatus,
      threadList,
      videos,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      actionsEnabled,
      alignment,
      goToMessage,
      groupStylesLength,
      hasReactions,
      isEditedMessageOpen,
      lastGroupMessage,
      lastReceivedId,
      membersValue,
      myMessageThemeString,
      reactionsValue,
      stringifiedMessage,
      stringifiedQuotedMessage,
      readBy,
      showAvatar,
      showMessageStatus,
      threadList,
    ],
  );

  return messageContext;
};
