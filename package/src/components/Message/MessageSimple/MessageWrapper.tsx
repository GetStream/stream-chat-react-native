import React from 'react';

import { View } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { MessageListProps } from '../../../components/MessageList/MessageList';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider, useTheme } from '../../../contexts/themeContext/ThemeContext';

import { Theme } from '../../../contexts/themeContext/utils/theme';
import { useStateStore } from '../../../hooks/useStateStore';
import { ChannelUnreadStateStoreType } from '../../../state-store/channel-unread-state';

const channelUnreadStateSelector = (state: ChannelUnreadStateStoreType) => ({
  first_unread_message_id: state.channelUnreadState?.first_unread_message_id,
  last_read: state.channelUnreadState?.last_read,
  last_read_message_id: state.channelUnreadState?.last_read_message_id,
  unread_messages: state.channelUnreadState?.unread_messages,
});

export type MessageWrapperProps = Pick<MessageContextValue, 'goToMessage'> &
  Pick<MessageListProps, 'onThreadSelect'> & {
    isNewestMessage?: boolean;
    message: LocalMessage;
    modifiedTheme?: Theme;
    dateSeparatorDate?: Date;
    messageGroupStyles?: string[];
  };

export const MessageWrapper = (props: MessageWrapperProps) => {
  const {
    dateSeparatorDate,
    isNewestMessage,
    message,
    messageGroupStyles,
    goToMessage,
    onThreadSelect,
    modifiedTheme,
  } = props;
  const { client } = useChatContext();
  const { channelUnreadStateStore, channel, highlightedMessageId, threadList } =
    useChannelContext();
  const {
    InlineDateSeparator,
    InlineUnreadIndicator,
    Message,
    MessageSystem,
    myMessageTheme,
    shouldShowUnreadUnderlay,
  } = useMessagesContext();

  const { first_unread_message_id, last_read, last_read_message_id, unread_messages } =
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
  const lastReadTimestamp = last_read?.getTime();
  const isLastReadMessage =
    last_read_message_id === message.id ||
    (!unread_messages && createdAtTimestamp === lastReadTimestamp);

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
      groupStyles={messageGroupStyles ?? []}
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
};
