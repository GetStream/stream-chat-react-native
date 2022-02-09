import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import type { MessageType } from './hooks/useMessageList';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  line: {
    flex: 1,
    height: 0.5,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textContainer: {
    flex: 3,
    marginTop: 10,
  },
});

export type MessageSystemProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: MessageType<StreamChatClient>;
  /**
   * Formatter function for date object.
   *
   * @param date TDateTimeParserInput object of message
   * @returns string
   */
  formatDate?: (date: TDateTimeParserInput) => string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A component to display system message. e.g, when someone updates the channel,
 * they can attach a message with that update. That message will be available
 * in message list as (type) system message.
 */
export const MessageSystem = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageSystemProps<StreamChatClient>,
) => {
  const { formatDate, message, style } = props;

  const {
    theme: {
      colors: { grey, grey_whisper },
      messageList: {
        messageSystem: { container, dateText, line, text, textContainer },
      },
    },
  } = useTheme();
  const { tDateTimeParser } = useTranslationContext();

  const createdAt = message.created_at;
  const parsedDate = tDateTimeParser(createdAt);
  const date =
    formatDate && createdAt
      ? formatDate(createdAt)
      : parsedDate && isDayOrMoment(parsedDate)
      ? parsedDate.calendar().toUpperCase()
      : parsedDate;

  return (
    <View style={[styles.container, style, container]} testID='message-system'>
      <View style={[styles.line, { backgroundColor: grey_whisper }, line]} />
      <View style={[styles.textContainer, textContainer]}>
        <Text style={[styles.text, { color: grey }, text]}>
          {message.text?.toUpperCase() || ''}
        </Text>
        <Text style={[styles.text, { color: grey }, dateText]}>{date}</Text>
      </View>
      <View style={[styles.line, { backgroundColor: grey_whisper }, line]} />
    </View>
  );
};

MessageSystem.displayName = 'MessageSystem{messageList{messageSystem}}';
