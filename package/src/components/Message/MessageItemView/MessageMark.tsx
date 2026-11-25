import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { useShouldUseOverlayStyles } from '../hooks/useShouldUseOverlayStyles';

const MAX_PLAYED_COUNT = 99;

export type MessageMarkProps = {
  /** Whether the channel is a direct message with one other member. */
  isDirectChannel: boolean;
  /** How many other users played the message. */
  playedCount: number;
  /** Whether to show the separator before the delivery status. */
  showSeparator?: boolean;
};

/**
 * The played state of the current user's message, shown in the message footer once another user
 * played it. A direct message reads "Played", any other channel "Played by" and the count.
 */
export const MessageMark = (props: MessageMarkProps) => {
  const { isDirectChannel, playedCount, showSeparator } = props;
  const { t } = useTranslationContext();
  const styles = useStyles();

  const label = isDirectChannel
    ? t('message.mark.played.text', 'Played')
    : t('message.mark.playedBy.text', 'Played by {{playedCount}}', {
        playedCount: playedCount > MAX_PLAYED_COUNT ? `${MAX_PLAYED_COUNT}+` : playedCount,
      });

  return (
    <View
      style={[styles.container, showSeparator ? styles.containerWithSeparator : null]}
      testID='message-mark'
    >
      <Text style={styles.text}>{label}</Text>
      {showSeparator ? <Text style={styles.separator}>·</Text> : null}
    </View>
  );
};

MessageMark.displayName = 'MessageMark{messageItemView{mark}}';

const useStyles = () => {
  const {
    theme: {
      messageItemView: {
        mark: { container, separator, text },
      },
      semantics,
    },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return useMemo(() => {
    const textStyle = {
      fontSize: primitives.typographyFontSizeXs,
      fontWeight: primitives.typographyFontWeightRegular,
      lineHeight: primitives.typographyLineHeightTight,
    };

    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXs,
        ...container,
      },
      // Adds to the footer's gap, so the status sits `spacingXs` away.
      containerWithSeparator: {
        marginEnd: primitives.spacingXxs,
      },
      separator: {
        ...textStyle,
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextTimestamp,
        ...separator,
      },
      text: {
        ...textStyle,
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextRead,
        ...text,
      },
    });
  }, [container, separator, shouldUseOverlayStyles, semantics, text]);
};
