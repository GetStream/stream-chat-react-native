import React from 'react';

import type { Message } from './utils/insertDates';

import {
  isDayOrMoment,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  justify-content: center;
  margin-bottom: 10px;
  ${({ theme }) => theme.messageList.messageSystem.container.css}
`;

const DateText = styled.Text`
  color: rgba(0, 0, 0, 0.5);
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  ${({ theme }) => theme.messageList.messageSystem.dateText.css}
`;

const Line = styled.View`
  background-color: ${({ theme }) => theme.colors.light};
  flex: 1;
  height: 0.5px;
  ${({ theme }) => theme.messageList.messageSystem.line.css}
`;

const Text = styled.Text`
  color: rgba(0, 0, 0, 0.5);
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  ${({ theme }) => theme.messageList.messageSystem.text.css}
`;

const TextContainer = styled.View`
  flex: 3;
  margin-top: 10px;
  ${({ theme }) => theme.messageList.messageSystem.textContainer.css}
`;

export type MessageSystemProps<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
> = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Formatter function for date object.
   *
   * @param date TDateTimeParserInput object of message
   * @returns string
   */
  formatDate?: (date: TDateTimeParserInput) => string;
};

/**
 * A component to display system message. e.g, when someone updates the channel,
 * they can attach a message with that update. That message will be available
 * in message list as (type) system message.
 */
const MessageSystem = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
>({
  formatDate,
  message,
}: MessageSystemProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { tDateTimeParser } = useTranslationContext();

  let date;

  if (formatDate && message?.created_at) {
    date = formatDate(message.created_at as TDateTimeParserInput);
  } else {
    date = tDateTimeParser(message.created_at as TDateTimeParserInput);
    if (isDayOrMoment(date)) {
      date = date.calendar().toUpperCase();
    }
  }

  return (
    <Container testID='message-system'>
      <Line />
      <TextContainer>
        <Text>{message?.text?.toUpperCase() || ''}</Text>
        <DateText>{date}</DateText>
      </TextContainer>
      <Line />
    </Container>
  );
};

export default MessageSystem;
