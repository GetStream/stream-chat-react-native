import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { Message } from './hooks/useMessageList';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Formatter function for date object.
   *
   * @param date TDateTimeParserInput object of message
   * @returns string
   */
  formatDate?: (date: TDateTimeParserInput) => string;
};

/**
 * A component to display system message. e.g, when someone updates the channel,
 * they can attach a message with that update. That message will be available
 * in message list as (type) system message.
 */
export const MessageSystem = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageSystemProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { formatDate, message } = props;

  const {
    theme: {
      messageList: {
        messageSystem: { container, dateText, line, text, textContainer },
      },
    },
  } = useTheme();
  const { tDateTimeParser } = useTranslationContext();

  const createdAt = message.created_at as TDateTimeParserInput | undefined;
  const parsedDate = tDateTimeParser(createdAt);
  const date =
    formatDate && createdAt
      ? formatDate(createdAt)
      : parsedDate && isDayOrMoment(parsedDate)
      ? parsedDate.calendar().toUpperCase()
      : parsedDate;

  return (
    <View style={[styles.container, container]} testID='message-system'>
      <View style={[styles.line, line]} />
      <View style={[styles.textContainer, textContainer]}>
        <Text style={[styles.text, text]}>
          {message.text?.toUpperCase() || ''}
        </Text>
        <Text style={[styles.text, dateText]}>{date}</Text>
      </View>
      <View style={[styles.line, line]} />
    </View>
  );
};

MessageSystem.displayName = 'MessageSystem{messageList{messageSystem}}';
