import React from 'react';

import { View } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { useMessageDateSeparator } from '../../../components/MessageList/hooks/useMessageDateSeparator';
import { useMessageGroupStyles } from '../../../components/MessageList/hooks/useMessageGroupStyles';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useMessageListItemContext } from '../../../contexts/messageListItemContext/MessageListItemContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider, useTheme } from '../../../contexts/themeContext/ThemeContext';

import { useStateStore } from '../../../hooks/useStateStore';
import { ChannelUnreadStateStoreType } from '../../../state-store/channel-unread-state';

const channelUnreadStateSelector = (state: ChannelUnreadStateStoreType) => ({
  first_unread_message_id: state.channelUnreadState?.first_unread_message_id,
  last_read_message_id: state.channelUnreadState?.last_read_message_id,
  last_read_timestamp: state.channelUnreadState?.last_read?.getTime(),
  unread_messages: state.channelUnreadState?.unread_messages,
});

export type MessageWrapperProps = {
  message: LocalMessage;
  previousMessage?: LocalMessage;
  nextMessage?: LocalMessage;
};

export const MessageWrapper = React.memo((props: MessageWrapperProps) => {
  const { message, previousMessage, nextMessage } = props;
  const { client } = useChatContext();
  const {
    channelUnreadStateStore,
    channel,
    hideDateSeparators,
    highlightedMessageId,
    maxTimeBetweenGroupedMessages,
    threadList,
  } = useChannelContext();
  const {
    getMessageGroupStyle,
    InlineDateSeparator,
    InlineUnreadIndicator,
    Message,
    MessageSystem,
    myMessageTheme,
    shouldShowUnreadUnderlay,
  } = useMessagesContext();
  const { goToMessage, onThreadSelect, noGroupByUser, modifiedTheme } = useMessageListItemContext();

  const dateSeparatorDate = useMessageDateSeparator({
    hideDateSeparators,
    message,
    previousMessage,
  });

  const isNewestMessage = nextMessage === undefined;
  const groupStyles = useMessageGroupStyles({
    dateSeparatorDate,
    getMessageGroupStyle,
    maxTimeBetweenGroupedMessages,
    message,
    nextMessage,
    noGroupByUser,
    previousMessage,
  });

  const { first_unread_message_id, last_read_timestamp, last_read_message_id, unread_messages } =
    useStateStore(channelUnreadStateStore.state, channelUnreadStateSelector);
  const {
    theme: {
      messageList: { messageContainer },
      screenPadding,
    },
  } = useTheme();
  if (!channel || channel.disconnected) {
    return null;
  }

  const createdAtTimestamp = message.created_at && new Date(message.created_at).getTime();
  const isLastReadMessage =
    last_read_message_id === message.id ||
    (!unread_messages && createdAtTimestamp === last_read_timestamp);

  const showUnreadSeparator =
    isLastReadMessage &&
    !isNewestMessage &&
    // The `channelUnreadState?.first_unread_message_id` is here for sent messages unread label
    (!!first_unread_message_id || !!unread_messages);

  const showUnreadUnderlay = !!shouldShowUnreadUnderlay && showUnreadSeparator;

  const wrapMessageInTheme = client.userID === message.user?.id && !!myMessageTheme;
  const renderDateSeperator = dateSeparatorDate ? (
    <InlineDateSeparator date={dateSeparatorDate} />
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
        <MessageSystem
          message={message}
          style={[{ paddingHorizontal: screenPadding }, messageContainer]}
        />
      ) : wrapMessageInTheme ? (
        <ThemeProvider mergedStyle={modifiedTheme}>
          <View testID={`message-list-item-${message.id}`}>
            {renderDateSeperator}
            {renderMessage}
          </View>
        </ThemeProvider>
      ) : (
        <View testID={`message-list-item-${message.id}`}>
          {renderDateSeperator}
          {renderMessage}
        </View>
      )}
      {showUnreadUnderlay && <InlineUnreadIndicator />}
    </View>
  );
});
