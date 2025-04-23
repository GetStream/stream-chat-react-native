import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { getDateString } from '../../utils/i18n/getDateString';

export type MessageSystemProps = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: LocalMessage;
  /**
   * Additional styles for the system message container.
   */
  style?: StyleProp<ViewStyle>;
  /*
   * Lookup key in the language corresponding translations sheet to perform date formatting
   */
};

/**
 * A component to display system message. e.g, when someone updates the channel,
 * they can attach a message with that update. That message will be available
 * in message list as (type) system message.
 */
export const MessageSystem = (props: MessageSystemProps) => {
  const { message, style } = props;

  const {
    theme: {
      colors: { grey, grey_whisper },
      messageList: {
        messageSystem: { container, dateText, line, text, textContainer },
      },
    },
  } = useTheme();
  const { t, tDateTimeParser } = useTranslationContext();

  const createdAt = message.created_at;

  const formattedDate = useMemo(
    () =>
      getDateString({
        date: createdAt,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/MessageSystem',
      }),
    [createdAt, t, tDateTimeParser],
  );

  return (
    <View style={[styles.container, style, container]} testID='message-system'>
      <View style={[styles.line, { backgroundColor: grey_whisper }, line]} />
      <View style={[styles.textContainer, textContainer]}>
        <Text style={[styles.text, { color: grey }, text]}>
          {message.text?.toUpperCase() || ''}
        </Text>
        {formattedDate && (
          <Text style={[styles.text, { color: grey }, dateText]}>
            {formattedDate.toString().toUpperCase()}
          </Text>
        )}
      </View>
      <View style={[styles.line, { backgroundColor: grey_whisper }, line]} />
    </View>
  );
};

MessageSystem.displayName = 'MessageSystem{messageList{messageSystem}}';

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
