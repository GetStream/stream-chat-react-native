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
  setIsEditedMessageOpen,
  showAvatar,
  showMessageOverlay,
  showMessageStatus,
  threadList,
  videos,
}: MessageContextValue) => {
  const groupStylesLength = groupStyles.length;
  const reactionsValue = reactions.map(({ count, own, type }) => `${own}${type}${count}`).join();
  const stringifiedMessage = stringifyMessage(message);

  const membersValue = JSON.stringify(members);
  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

  const quotedMessageDeletedValue = message.quoted_message?.deleted_at;

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
      setIsEditedMessageOpen,
      showAvatar,
      showMessageOverlay,
      showMessageStatus,
      threadList,
      videos,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      actionsEnabled,
      quotedMessageDeletedValue,
      alignment,
      goToMessage,
      groupStylesLength,
      hasReactions,
      isEditedMessageOpen,
      lastGroupMessage,
      lastReceivedId,
      membersValue,
      stringifiedMessage,
      myMessageThemeString,
      reactionsValue,
      showAvatar,
      showMessageStatus,
      threadList,
    ],
  );

  return messageContext;
};
