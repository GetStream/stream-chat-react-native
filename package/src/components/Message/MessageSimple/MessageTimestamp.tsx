import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { getDateString } from '../../../utils/i18n/getDateString';
import { useShouldUseOverlayStyles } from '../hooks/useShouldUseOverlayStyles';

export type MessageTimestampProps = Partial<Pick<TranslationContextValue, 'tDateTimeParser'>> & {
  /**
   * Already Formatted date
   */
  formattedDate?: string | Date;
  /**
   * The timestamp of the message.
   */
  timestamp?: string | Date;
  /*
   * Lookup key in the language corresponding translations sheet to perform date formatting
   */
  timestampTranslationKey?: string;
};

export const MessageTimestamp = (props: MessageTimestampProps) => {
  const {
    formattedDate,
    tDateTimeParser: propsTDateTimeParser,
    timestamp,
    timestampTranslationKey = 'timestamp/MessageTimestamp',
  } = props;
  const { t, tDateTimeParser: contextTDateTimeParser } = useTranslationContext();
  const tDateTimeParser = propsTDateTimeParser || contextTDateTimeParser;
  const styles = useStyles();

  const dateString = useMemo(
    () =>
      getDateString({
        date: timestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey,
      }),
    [timestamp, t, tDateTimeParser, timestampTranslationKey],
  );

  if (formattedDate) {
    return <Text style={styles.text}>{formattedDate.toString()}</Text>;
  }

  if (!dateString) {
    return null;
  }

  return <Text style={styles.text}>{dateString.toString()}</Text>;
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        content: { timestampText },
      },
    },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return useMemo(() => {
    return StyleSheet.create({
      text: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextTimestamp,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        ...timestampText,
      },
    });
  }, [shouldUseOverlayStyles, semantics, timestampText]);
};
