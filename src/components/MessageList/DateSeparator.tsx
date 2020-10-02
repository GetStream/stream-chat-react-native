import React from 'react';

import {
  isDayOrMoment,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';

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

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  justify-content: center;
  margin-vertical: 20px;
  ${({ theme }) => theme.messageList.dateSeparator.container.css}
`;

const Date = styled.Text`
  font-size: 10px;
  font-weight: 700;
  opacity: 0.8;
  text-transform: uppercase;
  ${({ theme }) => theme.messageList.dateSeparator.date.css}
`;

const DateText = styled.Text`
  font-size: 10px;
  margin-horizontal: 5px;
  opacity: 0.8;
  text-align: center;
  text-transform: uppercase;
  ${({ theme }) => theme.messageList.dateSeparator.dateText.css}
`;

const Line = styled.View`
  background-color: ${({ theme }) => theme.colors.light};
  flex: 1;
  height: 0.5px;
  ${({ theme }) => theme.messageList.dateSeparator.line.css}
`;

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
>({
  formatDate,
  message,
}: DateSeparatorProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { tDateTimeParser } = useTranslationContext();

  let date;

  if (formatDate) {
    date = formatDate(message.date as TDateTimeParserInput);
  } else {
    date = tDateTimeParser(message.date as TDateTimeParserInput);
  }

  return (
    <Container testID='date-separator'>
      <Line />
      <DateText>
        {formatDate ? (
          date
        ) : (
          <Date>{isDayOrMoment(date) ? date.calendar() : date}</Date>
        )}
      </DateText>
      <Line />
    </Container>
  );
};
