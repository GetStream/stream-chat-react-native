import { useMemo, useRef } from 'react';

import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';

import { stringifyMessage } from '../../../utils/utils';

function useStableRefValue<T>(value: T): T {
  const ref = useRef(value);

  if (ref.current !== value) {
    ref.current = value;
  }

  return ref.current;
}

export const useCreateMessageContext = ({
  actionsEnabled,
  alignment,
  channel,
  deliveredToCount,
  dismissOverlay,
  files,
  goToMessage,
  groupStyles,
  handleAction,
  handleReaction,
  handleToggleReaction,
  hasReactions,
  messageHasOnlySingleAttachment,
  images,
  isMessageAIGenerated,
  isMyMessage,
  lastGroupMessage,
  members,
  message,
  messageOverlayId,
  messageContentOrder,
  myMessageTheme,
  onLongPress,
  onlyEmojis,
  onOpenThread,
  onPress,
  onPressIn,
  onThreadSelect,
  otherAttachments,
  preventPress,
  reactions,
  readBy,
  showAvatar,
  showMessageOverlay,
  showReactionsOverlay,
  showMessageStatus,
  threadList,
  videos,
  setQuotedMessage,
}: MessageContextValue) => {
  const stableGroupStyles = useStableRefValue(groupStyles);
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
      deliveredToCount,
      dismissOverlay,
      files,
      goToMessage,
      groupStyles: stableGroupStyles,
      handleAction,
      handleReaction,
      handleToggleReaction,
      hasReactions,
      messageHasOnlySingleAttachment,
      images,
      isMessageAIGenerated,
      isMyMessage,
      lastGroupMessage,
      members,
      message,
      messageOverlayId,
      messageContentOrder,
      myMessageTheme,
      onLongPress,
      onlyEmojis,
      onOpenThread,
      onPress,
      onPressIn,
      onThreadSelect,
      otherAttachments,
      preventPress,
      reactions,
      readBy,
      setQuotedMessage,
      showAvatar,
      showMessageOverlay,
      showReactionsOverlay,
      showMessageStatus,
      threadList,
      videos,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      actionsEnabled,
      alignment,
      goToMessage,
      stableGroupStyles,
      hasReactions,
      messageHasOnlySingleAttachment,
      lastGroupMessage,
      membersValue,
      myMessageThemeString,
      messageOverlayId,
      reactionsValue,
      stringifiedMessage,
      stringifiedQuotedMessage,
      readBy,
      deliveredToCount,
      showAvatar,
      showMessageStatus,
      threadList,
      preventPress,
    ],
  );

  return messageContext;
};
