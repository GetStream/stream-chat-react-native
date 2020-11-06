import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  TDateTimeParserInput,
  TranslationContextValue,
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

export type DateSeparatorPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'formatDate'> &
  Pick<TranslationContextValue, 'tDateTimeParser'> & {
    message: DateSeparatorType<At, Ch, Co, Ev, Me, Re, Us>;
  };

const DateSeparatorWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: DateSeparatorPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { formatDate, message, tDateTimeParser } = props;

  const {
    theme: {
      colors: { light },
      messageList: {
        dateSeparator: { container, date, dateText, line },
      },
    },
  } = useTheme();

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

const MemoizedDateSeparator = React.memo(
  DateSeparatorWithContext,
  (prevProps, nextProps) => prevProps.message.date === nextProps.message.date,
) as typeof DateSeparatorWithContext;

export type DateSeparatorProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<DateSeparatorPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'message'>
> &
  Pick<DateSeparatorPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'message'>;

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
  const {
    formatDate: propFormatDate,
    message,
    tDateTimeParser: propTDateTimeParser,
  } = props;

  const { formatDate: contextFormatDate } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { tDateTimeParser: contextTDateTimeParser } = useTranslationContext();

  const formatDate = propFormatDate || contextFormatDate;
  const tDateTimeParser = propTDateTimeParser || contextTDateTimeParser;

  return (
    <MemoizedDateSeparator {...{ formatDate, message, tDateTimeParser }} />
  );
};

DateSeparator.displayName = 'DateSeparator{messageList{dateSeparator}}';
