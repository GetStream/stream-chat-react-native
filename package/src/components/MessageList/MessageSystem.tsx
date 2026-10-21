import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { convertTimestampToDate, LocalMessage } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { getDateString } from '../../i18n/utils';
import { primitives } from '../../theme';

export type MessageSystemProps = {
  /** The system message to render. */
  message: LocalMessage;
  /** Additional styles for the system message container. */
  style?: StyleProp<ViewStyle>;
};

/** Renders a message of type `system`, such as the one attached to a channel update. */
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
        messageCreatedAt: convertTimestampToDate(createdAt),
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.MessageSystem',
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
