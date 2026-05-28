import { useMemo, useRef } from 'react';

import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';

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
}: MessageContextValue) => {
  const stableGroupStyles = useStableRefValue(groupStyles);
  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

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
      hasReactions,
      messageHasOnlySingleAttachment,
      lastGroupMessage,
      // `members` ref is stable in steady-state (high-frequency events like
      // message.new / message.read / typing.* don't trigger the SDK's
      // copyStateFromChannel shallow-spread). When it does change, the
      // outer `Message.areEqual` `Object.keys.length` guard already
      // filters inner-member updates, so ref-equality here matches the
      // existing observable semantics.
      members,
      myMessageThemeString,
      messageOverlayId,
      // Replaces `stringifiedMessage` + `reactionsValue`: stream-chat-js
      // `_updateMessage` always replaces the Message object (and these
      // nested fields with it) rather than mutating in place, so
      // ref-equality on the fields equals content-equality.
      message.type,
      message.deleted_at,
      message.text,
      message.reply_count,
      message.status,
      message.updated_at,
      message.i18n,
      message.attachments,
      message.latest_reactions,
      message.reaction_groups,
      // Replaces `stringifiedQuotedMessage` — matches the
      // `stringifyMessage({ includeReactions: false })` field list.
      message.quoted_message?.type,
      message.quoted_message?.deleted_at,
      message.quoted_message?.text,
      message.quoted_message?.reply_count,
      message.quoted_message?.status,
      message.quoted_message?.updated_at,
      message.quoted_message?.i18n,
      message.quoted_message?.attachments,
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
