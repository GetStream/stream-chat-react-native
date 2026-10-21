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
  const nextMessageId = nextMessage?.id;
  const nextMessageIsOwn = nextMessage?.user?.id === client.userID;
  const nextMessageCreatedAt = nextMessage?.created_at ?? undefined;

  // The unread separator goes on the row above the first unread message from another user. It is
  // located per message inside the selector, so the flag stays `false` for every other row and a
  // mark-read only re-renders the boundary rows whose flag flips, not the whole list.
  const showUnreadSeparatorSelector = useCallback(
    (snapshot: UnreadSnapshotState) => {
      let showUnreadSeparator: boolean;
      if (snapshot.firstUnreadMessageId) {
        // Frozen boundary (channel open or mark-unread): anchor to the known first unread ID.
        showUnreadSeparator = nextMessageId === snapshot.firstUnreadMessageId;
      } else if (snapshot.unreadCount) {
        // Live boundary: the separator goes on the last read row (created at or before
        // `lastReadAt`) whose newer neighbor is the first unread from another user. Requiring this
        // row to be read keeps it to one separator when own messages are interleaved among the
        // unreads, as an own message sent after the boundary is not read.
        const lastReadAt = snapshot.lastReadAt ?? 0;
        const nextIsUnreadFromOther =
          !!nextMessageId &&
          !nextMessageIsOwn &&
          nextMessageCreatedAt !== undefined &&
          nextMessageCreatedAt > lastReadAt;
        const thisIsRead =
          typeof createdAtTimestamp === 'number' && createdAtTimestamp <= lastReadAt;
        // Own messages sent elsewhere after the boundary leave no read row above the first unread,
        // so the rule above never fires. Anchor on the last read message then.
        const isLastReadBeforeOwnUnread =
          thisIsRead &&
          messageId === snapshot.lastReadMessageId &&
          nextMessageIsOwn &&
          nextMessageCreatedAt !== undefined &&
          nextMessageCreatedAt > lastReadAt;
        showUnreadSeparator = (nextIsUnreadFromOther && thisIsRead) || isLastReadBeforeOwnUnread;
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
    [createdAtTimestamp, messageId, nextMessageCreatedAt, nextMessageId, nextMessageIsOwn],
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

  const wrapMessageInTheme = client.userID === message.user?.id && !!myMessageTheme;
  const renderDateSeperator = dateSeparatorDate ? (
    <View style={styles.dateSeparatorContainer}>
      <InlineDateSeparator date={dateSeparatorDate} />
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
          <MessageSystem message={message} style={messageContainer} />
        </>
      ) : wrapMessageInTheme ? (
        <ThemeProvider mergedStyle={modifiedTheme}>
          {renderDateSeperator}
          {renderMessage}
        </ThemeProvider>
      ) : (
        <>
          {renderDateSeperator}
          {renderMessage}
        </>
      )}
      {showUnreadUnderlay && (
        <View style={styles.unreadUnderlayContainer}>
          <InlineUnreadIndicator unreadCount={unreadCount} />
        </View>
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
