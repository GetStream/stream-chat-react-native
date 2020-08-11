import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';

import { TranslationContext } from '../../context';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 10;
  ${({ theme }) => theme.messageList.messageSystem.container.css}
`;

const Line = styled.View`
  flex: 1;
  height: 0.5;
  background-color: ${({ theme }) => theme.colors.light};
  ${({ theme }) => theme.messageList.messageSystem.line.css}
`;

const TextContainer = styled.View`
  margin-top: 10;
  flex: 3;
  ${({ theme }) => theme.messageList.messageSystem.textContainer.css}
`;

const Text = styled.Text`
  text-align: center;
  font-size: 10;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.5);
  ${({ theme }) => theme.messageList.messageSystem.text.css}
`;

const DateText = styled.Text`
  text-align: center;
  font-size: 10;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.5);
  ${({ theme }) => theme.messageList.messageSystem.dateText.css}
`;

/**
 * A component to display system message. e.g, when someone updates the channel,
 * they can attach a message with that update. That message will be available
 * in message list as (type) system message.
 */
const MessageSystem = ({ message }) => {
  const { tDateTimeParser } = useContext(TranslationContext);
  return (
    <Container testID={'message-system'}>
      <Line />
      <TextContainer>
        <Text>{message.text.toUpperCase()}</Text>
        <DateText>
          {tDateTimeParser(message.created_at)
            .calendar()
            .toUpperCase()}
        </DateText>
      </TextContainer>
      <Line />
    </Container>
  );
};

export default MessageSystem;
