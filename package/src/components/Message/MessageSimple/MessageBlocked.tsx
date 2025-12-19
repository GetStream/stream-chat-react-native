import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

export type MessageBlockedProps = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: LocalMessage;
  /**
   * Additional styles for the system message container.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * A component to display blocked message. e.g, when a message is blocked by moderation policies.
 */
export const MessageBlocked = (props: MessageBlockedProps) => {
  const { message, style } = props;

  const {
    theme: {
      colors: { grey, grey_whisper },
      messageSimple: {
        messageBlocked: { container, line, text, textContainer },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, style, container]} testID='message-system'>
      <View style={[styles.line, { backgroundColor: grey_whisper }, line]} />
      <View style={[styles.textContainer, textContainer]}>
        <Text style={[styles.text, { color: grey }, text]}>
          {message.text?.toUpperCase() || ''}
        </Text>
      </View>
      <View style={[styles.line, { backgroundColor: grey_whisper }, line]} />
    </View>
  );
};

MessageBlocked.displayName = 'MessageBlocked{messageList{messageBlocked}}';

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
