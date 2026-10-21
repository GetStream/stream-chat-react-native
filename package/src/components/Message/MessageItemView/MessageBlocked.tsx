import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type MessageBlockedProps = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: LocalMessage;
  /** Additional styles for the container. */
  style?: StyleProp<ViewStyle>;
};

/** Displays a message that was blocked, such as by moderation policies. */
export const MessageBlocked = (props: MessageBlockedProps) => {
  const { message, style } = props;

  const styles = useStyles();

  return (
    <View style={[styles.container, style]} testID='message-system'>
      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
};

MessageBlocked.displayName = 'MessageBlocked{messageList{messageBlocked}}';

const useStyles = () => {
  const {
    theme: {
      messageItemView: {
        messageBlocked: { container, text },
      },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        borderRadius: primitives.radiusXl,
        borderWidth: 1,
        borderColor: semantics.borderCoreSubtle,
        backgroundColor: semantics.backgroundCoreSurfaceSubtle,
        paddingVertical: primitives.spacingXs,
        paddingHorizontal: primitives.spacingSm,
        marginVertical: primitives.spacingXs,
        ...container,
      },
      text: {
        color: semantics.chatTextSystem,
        textAlign: 'center',
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        ...text,
      },
    });
  }, [container, text, semantics]);
};
