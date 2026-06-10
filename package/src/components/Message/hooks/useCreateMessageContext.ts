import { useMemo, useRef } from 'react';

import { useAccessibilityContext } from '../../../contexts/accessibilityContext/AccessibilityContext';
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
  contextMenuAnchorRef,
  deliveredToCount,
  dismissOverlay,
  files,
  goToMessage,
  groupStyles,
  handleAction,
  hasAttachmentActions,
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
  registerMessageOverlayTarget,
  unregisterMessageOverlayTarget,
  reactions,
  readBy,
  showAvatar,
  showMessageOverlay,
  showReactionsOverlay,
  showMessageStatus,
  threadList,
  videos,
  setQuotedMessage,
}: Omit<MessageContextValue, 'hasInteractiveAccessibilityContent'>) => {
  const stableGroupStyles = useStableRefValue(groupStyles);
  const reactionsValue = reactions.map(({ count, own, type }) => `${own}${type}${count}`).join();
  const stringifiedMessage = stringifyMessage({ message });

  const membersValue = JSON.stringify(members);
  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

  const stringifiedQuotedMessage = message.quoted_message
    ? stringifyMessage({ includeReactions: false, message: message.quoted_message })
    : '';

  // Resolved here (not at each consumer) so the boolean lives on MessageContext
  // and downstream components (MessageContent, MessageTextContainer) read it
  // directly. The predicate's identity is stable in the default case; an
  // integrator override is expected to be stable too (documented on the config).
  const { hasInteractiveAccessibilityContent: hasInteractiveAccessibilityContentPredicate } =
    useAccessibilityContext();
  const hasInteractiveAccessibilityContent = hasInteractiveAccessibilityContentPredicate(message);

  const messageContext: MessageContextValue = useMemo(
    () => ({
      actionsEnabled,
      alignment,
      channel,
      contextMenuAnchorRef,
      deliveredToCount,
      dismissOverlay,
      files,
      goToMessage,
      groupStyles: stableGroupStyles,
      handleAction,
      hasAttachmentActions,
      handleReaction,
      handleToggleReaction,
      hasInteractiveAccessibilityContent,
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
      registerMessageOverlayTarget,
      unregisterMessageOverlayTarget,
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
      hasAttachmentActions,
      hasInteractiveAccessibilityContent,
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
      unregisterMessageOverlayTarget,
    ],
  );

  return messageContext;
};
