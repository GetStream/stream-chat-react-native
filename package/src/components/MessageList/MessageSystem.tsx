import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { primitives } from '../../theme';
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
      messageList: {
        messageSystem: { dateText },
      },
    },
  } = useTheme();
  const styles = useStyles();
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
    <View style={[styles.container, style]} testID='message-system'>
      <Text style={styles.text}>{message.text || ''}</Text>
      {formattedDate && <Text style={[styles.text, dateText]}>{formattedDate.toString()}</Text>}
    </View>
  );
};

MessageSystem.displayName = 'MessageSystem{messageList{messageSystem}}';

const useStyles = () => {
  const {
    theme: {
      messageSimple: {
        messageBlocked: { container, text },
      },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: primitives.radiusXl,
        borderWidth: 1,
        borderColor: semantics.borderCoreSubtle,
        backgroundColor: semantics.backgroundCoreSurfaceSubtle,
        paddingVertical: primitives.spacingXs,
        paddingHorizontal: primitives.spacingSm,
        gap: primitives.spacingXs,
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
