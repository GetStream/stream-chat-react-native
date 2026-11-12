import React, { useCallback, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { LocalMessage, UnreadSnapshotState } from 'stream-chat';

import { useMessageDateSeparator } from '../../../components/MessageList/hooks/useMessageDateSeparator';
import { useMessageGroupStyles } from '../../../components/MessageList/hooks/useMessageGroupStyles';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useMessageListItemContext } from '../../../contexts/messageListItemContext/MessageListItemContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider, useTheme } from '../../../contexts/themeContext/ThemeContext';

import { useIsTargetedMessage } from '../../../hooks/useIsTargetedMessage';
import { useMessagePaginator } from '../../../hooks/useMessagePaginator';
import { useStateStore } from '../../../hooks/useStateStore';
import { primitives } from '../../../theme';

export type MessageWrapperProps = {
  message: LocalMessage;
  previousMessage?: LocalMessage;
  nextMessage?: LocalMessage;
};

export const MessageWrapper = React.memo(function MessageWrapper(props: MessageWrapperProps) {
  const { message, previousMessage, nextMessage } = props;
  const { client } = useChatContext();
  const { allowDateSeparatorForSystemMessages, hideDateSeparators, maxTimeBetweenGroupedMessages } =
    useChannelContext();

  const messagePaginator = useMessagePaginator();
  const isTargetedMessage = useIsTargetedMessage(message.id);
  const { InlineDateSeparator, InlineUnreadIndicator, Message, MessageSystem } =
    useComponentsContext();
  const { getMessageGroupStyle, myMessageTheme, shouldShowUnreadUnderlay } = useMessagesContext();
  const { goToMessage, onThreadSelect, noGroupByUser, modifiedTheme } = useMessageListItemContext();

  const dateSeparatorDate = useMessageDateSeparator({
    hideDateSeparators,
    message,
    previousMessage,
  });

  const groupStyles = useMessageGroupStyles({
    dateSeparatorDate,
    getMessageGroupStyle,
    maxTimeBetweenGroupedMessages,
    message,
    previousMessage,
    nextMessage,
    noGroupByUser,
  });

  // `created_at` is a numeric wire timestamp, directly comparable (`new Date(ns)` yields NaN).
  const createdAtTimestamp = message.created_at;
  const messageId = message.id;
  const isOwnMessage = message.user?.id === client.userId;
  const previousMessageId = previousMessage?.id;
  const previousMessageCreatedAt = previousMessage?.created_at ?? undefined;
  const isThreadList = !!messagePaginator.parentMessageId;

  // The unread separator goes on the first unread row, below its date separator and above the
  // message, with the last read message as its older neighbor. It is located per message inside the
  // selector, so the flag stays `false` for every other row and a mark-read only re-renders the
  // boundary rows whose flag flips, not the whole list.
  const showUnreadSeparatorSelector = useCallback(
    (snapshot: UnreadSnapshotState) => {
      let showUnreadSeparator: boolean;
      if (isThreadList || !previousMessageId) {
        showUnreadSeparator = false;
      } else if (snapshot.firstUnreadMessageId) {
        // Frozen boundary (channel open or mark-unread): anchor to the known first unread ID.
        showUnreadSeparator = messageId === snapshot.firstUnreadMessageId;
      } else if (snapshot.unreadCount) {
        // Live boundary: the separator goes on the first unread from another user whose older
        // neighbor is read (created at or before `lastReadAt`). Requiring that neighbor to be read
        // keeps it to one separator when own messages are interleaved among the unreads, as an own
        // message sent after the boundary is not read.
        const lastReadAt = snapshot.lastReadAt ?? 0;
        const thisIsUnread =
          typeof createdAtTimestamp === 'number' && createdAtTimestamp > lastReadAt;
        const previousIsRead =
          previousMessageCreatedAt !== undefined && previousMessageCreatedAt <= lastReadAt;
        // Own messages sent elsewhere after the boundary leave no read row above the first unread
        // from another user, so the rule above never fires. Anchor on the last read message then.
        const isOwnUnreadAfterLastRead =
          isOwnMessage && previousMessageId === snapshot.lastReadMessageId;
        showUnreadSeparator =
          thisIsUnread && previousIsRead && (!isOwnMessage || isOwnUnreadAfterLastRead);
      } else {
        showUnreadSeparator = false;
      }

      return {
        showUnreadSeparator,
        // Only the boundary row needs the unread count (for its inline indicator). Gating it on
        // `showUnreadSeparator` keeps it `undefined` elsewhere, so a changing channel-wide count
        // does not re-render the whole list.
        unreadCount: showUnreadSeparator ? snapshot.unreadCount : undefined,
      };
    },
    [
      createdAtTimestamp,
      isOwnMessage,
      isThreadList,
      messageId,
      previousMessageCreatedAt,
      previousMessageId,
    ],
  );
  const { showUnreadSeparator, unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    showUnreadSeparatorSelector,
  );

  const {
    theme: {
      messageList: { messageContainer },
    },
  } = useTheme();
  const styles = useStyles();

  const showUnreadUnderlay = !!shouldShowUnreadUnderlay && showUnreadSeparator;

  const wrapMessageInTheme = client.userId === message.user?.id && !!myMessageTheme;
  const renderDateSeperator = dateSeparatorDate ? (
    <View style={styles.dateSeparatorContainer}>
      <InlineDateSeparator date={dateSeparatorDate} />
    </View>
  ) : null;
  const renderUnreadIndicator = showUnreadUnderlay ? (
    <View style={styles.unreadUnderlayContainer}>
      <InlineUnreadIndicator unreadCount={unreadCount} />
    </View>
  ) : null;

  const renderMessage = (
    <Message
      goToMessage={goToMessage}
      groupStyles={groupStyles}
      isTargetedMessage={isTargetedMessage}
      isVeryLastMessage={!nextMessage}
      message={message}
      onThreadSelect={onThreadSelect}
      showUnreadUnderlay={showUnreadUnderlay}
      style={[messageContainer]}
    />
  );

  return (
    <View testID={`message-list-item-${message.id}`}>
      {message.type === 'system' ? (
        <>
          {allowDateSeparatorForSystemMessages ? renderDateSeperator : null}
          {renderUnreadIndicator}
          <MessageSystem message={message} style={messageContainer} />
        </>
      ) : wrapMessageInTheme ? (
        <ThemeProvider mergedStyle={modifiedTheme}>
          {renderDateSeperator}
          {renderUnreadIndicator}
          {renderMessage}
        </ThemeProvider>
      ) : (
        <>
          {renderDateSeperator}
          {renderUnreadIndicator}
          {renderMessage}
        </>
      )}
    </View>
  );
});

const useStyles = () => {
  const {
    theme: {
      messageList: {
        unreadUnderlayContainer,
        inlineDateSeparatorContainer,
        systemMessageContainer,
      },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        dateSeparatorContainer: {
          paddingVertical: primitives.spacingXs,
          ...inlineDateSeparatorContainer,
        },
        unreadUnderlayContainer: {
          paddingVertical: primitives.spacingXs,
          ...unreadUnderlayContainer,
        },
        systemMessageContainer: {
          alignItems: 'center',
          ...systemMessageContainer,
        },
      }),
    [unreadUnderlayContainer, inlineDateSeparatorContainer, systemMessageContainer],
  );
};
