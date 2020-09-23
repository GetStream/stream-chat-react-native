import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components/native';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  justify-content: center;
  margin-bottom: 10px;
  ${({ theme }) => theme.messageList.messageSystem.container.css}
`;

const Line = styled.View`
  background-color: ${({ theme }) => theme.colors.light};
  flex: 1;
  height: 0.5px;
  ${({ theme }) => theme.messageList.messageSystem.line.css}
`;

const TextContainer = styled.View`
  flex: 3;
  margin-top: 10px;
  ${({ theme }) => theme.messageList.messageSystem.textContainer.css}
`;

const Text = styled.Text`
  color: rgba(0, 0, 0, 0.5);
  font-size: 10;
  font-weight: bold;
  text-align: center;
  ${({ theme }) => theme.messageList.messageSystem.text.css}
`;

const DateText = styled.Text`
  color: rgba(0, 0, 0, 0.5);
  font-size: 10;
  font-weight: bold;
  text-align: center;
  ${({ theme }) => theme.messageList.messageSystem.dateText.css}
`;

/**
 * A component to display system message. e.g, when someone updates the channel,
 * they can attach a message with that update. That message will be available
 * in message list as (type) system message.
 */
const MessageSystem = ({ message }) => {
  const { tDateTimeParser } = useTranslationContext();
  return (
    <Container testID='message-system'>
      <Line />
      <TextContainer>
        <Text>{message.text.toUpperCase()}</Text>
        <DateText>
          {tDateTimeParser(message.created_at).calendar().toUpperCase()}
        </DateText>
      </TextContainer>
      <Line />
    </Container>
  );
};

MessageSystem.propTypes = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object.isRequired,
};

export default MessageSystem;
