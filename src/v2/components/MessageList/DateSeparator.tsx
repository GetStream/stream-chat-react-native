import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { DateSeparator as DateSeparatorType } from './utils/insertDates';

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
    marginVertical: 20,
  },
  date: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 10,
    marginHorizontal: 5,
    opacity: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  line: {
    flex: 1,
    height: 0.5,
  },
});

export type DateSeparatorProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  message: DateSeparatorType<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Formatter function for date object.
   *
   * @param date TDateTimeParserInput object of message
   * @returns string
   */
  formatDate?: (date: TDateTimeParserInput) => string;
};

/**
 * @example ./DateSeparator.md
 */
export const DateSeparator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: DateSeparatorProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { formatDate, message } = props;

  const {
    theme: {
      colors: { light },
      messageList: {
        dateSeparator: { container, date, dateText, line },
      },
    },
  } = useTheme();
  const { tDateTimeParser } = useTranslationContext();

  const formattedDate = formatDate
    ? formatDate(message.date as TDateTimeParserInput)
    : tDateTimeParser(message.date as TDateTimeParserInput);

  return (
    <View style={[styles.container, container]} testID='date-separator'>
      <View style={[styles.line, { backgroundColor: light }, line]} />
      <Text style={[styles.dateText, dateText]}>
        {formatDate ? (
          formattedDate
        ) : (
          <Text style={[styles.date, date]}>
            {isDayOrMoment(formattedDate)
              ? formattedDate.calendar()
              : formattedDate}
          </Text>
        )}
      </Text>
      <View style={[styles.line, { backgroundColor: light }, line]} />
    </View>
  );
};

DateSeparator.displayName = 'DateSeparator{messageList{dateSeparator}}';
