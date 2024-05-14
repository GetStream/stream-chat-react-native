import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  TDateTimeParserInput,
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../../utils/getDateString';

export type MessageTimestampPropsWithContext = Pick<TranslationContextValue, 'tDateTimeParser'> & {
  /**
   * Whether to show the time in Calendar time format. Calendar time displays time relative to a today's date.
   */
  calendar?: boolean;
  /**
   * The format in which the date should be displayed.
   */
  format?: string;
  /**
   * A function to format the date.
   */
  formatDate?: (date: TDateTimeParserInput) => string;
  /**
   * The timestamp of the message.
   */
  timestamp?: string | Date;
};

export const MessageTimestampWithContext = (props: MessageTimestampPropsWithContext) => {
  const { calendar, format, formatDate, tDateTimeParser, timestamp } = props;
  const {
    theme: {
      colors: { grey },
      messageSimple: {
        content: { timestampText },
      },
    },
  } = useTheme();

  if (!timestamp) return null;

  const formattedDate = getDateString({
    calendar,
    date: timestamp,
    format,
    formatDate,
    tDateTimeParser,
  });

  if (!formattedDate) return null;

  return (
    <Text style={[styles.text, { color: grey }, timestampText]}>{formattedDate.toString()}</Text>
  );
};

const MemoizedMessageTimestamp = React.memo(
  MessageTimestampWithContext,
  () => true,
) as typeof MessageTimestampWithContext;

export type MessageTimestampProps = Partial<MessageTimestampPropsWithContext>;

export const MessageTimestamp = (props: MessageTimestampProps) => {
  const { tDateTimeParser } = useTranslationContext();

  return (
    <MemoizedMessageTimestamp
      {...{
        tDateTimeParser,
        ...props,
      }}
    />
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
  },
});
