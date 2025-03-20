import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { isMessageWithStylesReadByAndDateSeparator, MessageType } from './hooks/useMessageList';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';

import { mergeThemes, ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';
import { ChannelUnreadState, DefaultStreamChatGenerics } from '../../types/types';

const shouldShowUnreadSeparator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatGenerics>,
  index: number,
  unreadState?: ChannelUnreadState,
) => {
  if (!unreadState) {
    return false;
  }
  const createdAtTimestamp = message.created_at && new Date(message.created_at).getTime();
  const lastReadTimestamp = unreadState?.last_read?.getTime();
  const isNewestMessage = index === 0;
  const isLastReadMessage =
    unreadState?.last_read_message_id === message.id ||
    (!unreadState?.unread_messages && createdAtTimestamp === lastReadTimestamp);

  const showUnreadSeparator =
    isLastReadMessage &&
    !isNewestMessage &&
    (!!unreadState?.first_unread_message_id || !!unreadState?.unread_messages);

  return showUnreadSeparator;
};

export const MessageItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  index,
  message,
  goToMessage,
  highlightedMessageId,
  lastReceivedMessageId,
  onThreadSelect,
  shouldApplyAndroidWorkaround,
}: {
  index: number;
  message: MessageType<StreamChatGenerics>;
  goToMessage: (messageId: string) => Promise<void>;
  highlightedMessageId?: string;
  lastReceivedMessageId?: string;
  onThreadSelect?: (message: MessageType<DefaultStreamChatGenerics>) => void;
  shouldApplyAndroidWorkaround: boolean;
}) => {
  const { client } = useChatContext();
  const clientUserId = client.user?.id;
  const { theme } = useTheme();
  const {
    messageList: { messageContainer },
    screenPadding,
  } = theme;

  const { channelUnreadState, threadList } = useChannelContext();
  const {
    Message,
    MessageSystem,
    myMessageTheme,
    InlineDateSeparator,
    InlineUnreadIndicator,
    shouldShowUnreadUnderlay,
  } = useMessagesContext();

  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

  const modifiedTheme = useMemo(
    () => mergeThemes({ style: myMessageTheme, theme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myMessageThemeString, theme],
  );

  const showUnreadUnderlay =
    !!shouldShowUnreadUnderlay && shouldShowUnreadSeparator(message, index, channelUnreadState);

  const wrapMessageInTheme = clientUserId === message.user?.id && !!myMessageTheme;
  const renderDateSeperator = isMessageWithStylesReadByAndDateSeparator(message) &&
    message.dateSeparator && <InlineDateSeparator date={message.dateSeparator} />;

  const renderMessage = (
    <Message
      goToMessage={goToMessage}
      groupStyles={isMessageWithStylesReadByAndDateSeparator(message) ? message.groupStyles : []}
      isTargetedMessage={highlightedMessageId === message.id}
      lastReceivedId={
        lastReceivedMessageId === message.id || message.quoted_message_id
          ? lastReceivedMessageId
          : undefined
      }
      message={message}
      onThreadSelect={onThreadSelect}
      showUnreadUnderlay={showUnreadUnderlay}
      style={[messageContainer]}
      threadList={threadList}
    />
  );

  return (
    <View
      style={[shouldApplyAndroidWorkaround ? styles.invertAndroid : undefined]}
      testID={`message-list-item-${index}`}
    >
      {message.type === 'system' ? (
        <MessageSystem
          message={message}
          style={[{ paddingHorizontal: screenPadding }, messageContainer]}
        />
      ) : wrapMessageInTheme ? (
        <ThemeProvider mergedStyle={modifiedTheme}>
          <View testID={`message-list-item-${index}`}>
            {renderDateSeperator}
            {renderMessage}
          </View>
        </ThemeProvider>
      ) : (
        <View testID={`message-list-item-${index}`}>
          {renderDateSeperator}
          {renderMessage}
        </View>
      )}
      {showUnreadUnderlay && <InlineUnreadIndicator />}
    </View>
  );
};

const styles = StyleSheet.create({
  invertAndroid: {
    transform: [{ scaleX: -1 }, { scaleY: -1 }],
  },
});
