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
  const {
    channel,
    hideDateSeparators,
    highlightedMessageId,
    maxTimeBetweenGroupedMessages,
    threadList,
  } = useChannelContext();
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

  const createdAtTimestamp = message.created_at && new Date(message.created_at).getTime();
  const nextMessageId = nextMessage?.id;
  const nextMessageIsOwn = nextMessage?.user?.id === client.userID;
  const nextMessageCreatedAt = nextMessage?.created_at
    ? new Date(nextMessage.created_at).getTime()
    : undefined;

  // The unread separator belongs above the first UNREAD message from another user — i.e. on the row
  // whose newer neighbour is that first unread. We locate it per-message inside the selector so
  // `useStateStore`'s per-key comparison keeps the flag referentially stable (`false === false`) for
  // every non-boundary row: a mark-read changes the channel-wide unread fields but only re-renders
  // the one or two boundary rows whose flag actually flips, not the whole list.
  //
  // We deliberately do NOT anchor on `lastReadMessageId`. It tracks the last read message from
  // ANOTHER user and is not advanced by our own sends, so anchoring on it drops the separator in
  // front of our own just-sent messages (read → us → new-unread would wrongly separate before "us").
  // Skipping our own messages (they are always read) places it correctly above the first incoming
  // unread instead.
  const showUnreadSeparatorSelector = useCallback(
    (snapshot: UnreadSnapshotState) => {
      let showUnreadSeparator: boolean;
      if (snapshot.firstUnreadMessageId) {
        // Frozen boundary (channel open / mark-unread): anchor directly to the known first-unread id.
        showUnreadSeparator = nextMessageId === snapshot.firstUnreadMessageId;
      } else if (snapshot.unreadCount) {
        // Live boundary: the separator sits above the FIRST unread-from-another message — i.e. on
        // the last genuinely-read row (created at/before the read boundary) whose newer neighbour is
        // that first unread. Gating on "this row is read" (rather than "this row isn't itself an
        // unread-from-another") keeps it to a SINGLE separator even when our own messages are
        // interleaved among the unreads: an own message sent after the boundary is not "read" by
        // this test, so `own → unread-from-another` transitions further down never start a second
        // separator. Chronological ordering guarantees exactly one read→unread transition.
        const lastReadAtMs = snapshot.lastReadAt?.getTime() ?? 0;
        const nextIsUnreadFromOther =
          !!nextMessageId &&
          !nextMessageIsOwn &&
          nextMessageCreatedAt !== undefined &&
          nextMessageCreatedAt > lastReadAtMs;
        const thisIsRead =
          typeof createdAtTimestamp === 'number' && createdAtTimestamp <= lastReadAtMs;
        showUnreadSeparator = nextIsUnreadFromOther && thisIsRead;
      } else {
        showUnreadSeparator = false;
      }

      return {
        showUnreadSeparator,
        // Only the boundary row needs the unread count (for its inline indicator). Gating it on
        // `showUnreadSeparator` keeps this `undefined` for every other row, so the channel-wide
        // count changing on each mark-read doesn't re-render the whole list.
        unreadCount: showUnreadSeparator ? snapshot.unreadCount : undefined,
      };
    },
    [createdAtTimestamp, nextMessageCreatedAt, nextMessageId, nextMessageIsOwn],
  );
  const { showUnreadSeparator, unreadCount } = useStateStore(
    channel.messagePaginator.unreadStateSnapshot,
    showUnreadSeparatorSelector,
  );

  const {
    theme: {
      messageList: { messageContainer },
    },
  } = useTheme();
  const styles = useStyles();
  if (!channel || channel.pendingDisposal) {
    return null;
  }

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
      isTargetedMessage={highlightedMessageId === message.id}
      message={message}
      onThreadSelect={onThreadSelect}
      showUnreadUnderlay={showUnreadUnderlay}
      style={[messageContainer]}
      threadList={threadList}
    />
  );

  return (
    <View testID={`message-list-item-${message.id}`}>
      {message.type === 'system' ? (
        <MessageSystem message={message} style={messageContainer} />
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
