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

  // The unread separator sits on the first unread row, between its date separator and the message.
  // Resolved per row in the selector, so only the boundary rows re-render when it moves.
  const showUnreadSeparatorSelector = useCallback(
    (snapshot: UnreadSnapshotState) => {
      let showUnreadSeparator: boolean;
      if (isThreadList || !previousMessageId) {
        showUnreadSeparator = false;
      } else if (snapshot.firstUnreadMessageId) {
        // Channel open and mark-unread freeze the boundary at a known first unread ID.
        showUnreadSeparator = messageId === snapshot.firstUnreadMessageId;
      } else if (snapshot.unreadCount) {
        // The live boundary is the first unread from another user whose previous message is read.
        // Own messages among the unreads are not read, so this matches only once.
        const lastReadAt = snapshot.lastReadAt ?? 0;
        const thisIsUnread =
          typeof createdAtTimestamp === 'number' && createdAtTimestamp > lastReadAt;
        const previousIsRead =
          previousMessageCreatedAt !== undefined && previousMessageCreatedAt <= lastReadAt;
        // When own messages follow the last read one, anchor on the last read message instead.
        const isOwnUnreadAfterLastRead =
          isOwnMessage && previousMessageId === snapshot.lastReadMessageId;
        showUnreadSeparator =
          thisIsUnread && previousIsRead && (!isOwnMessage || isOwnUnreadAfterLastRead);
      } else {
        showUnreadSeparator = false;
      }

      return {
        showUnreadSeparator,
        // Only the boundary row reads the count, so count changes don't re-render the other rows.
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
