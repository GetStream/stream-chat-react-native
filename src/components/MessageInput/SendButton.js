import React, { useContext } from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

import { MessagesContext } from '../../context';
import iconEdit from '../../images/icons/icon_edit.png';
import iconSendNewMessage from '../../images/icons/icon_new_message.png';
import { themed } from '../../styles/theme';

const Container = styled.TouchableOpacity`
  margin-left: 8px;
  ${({ theme }) => theme.messageInput.sendButton.css};
`;

const SendButtonIcon = styled.Image`
  height: 15px;
  width: 15px;
  ${({ theme }) => theme.messageInput.sendButtonIcon.css};
`;

/**
 * UI Component for send button in MessageInput component.
 *
 * @example ../docs/SendButton.md
 */
const SendButton = ({ disabled = false, sendMessage }) => {
  const { editing } = useContext(MessagesContext);
  return (
    <Container disabled={disabled} onPress={sendMessage} testID='send-button'>
      <SendButtonIcon source={editing ? iconEdit : iconSendNewMessage} />
    </Container>
  );
};

SendButton.propTypes = {
  /** Disables the button */
  disabled: PropTypes.bool,
  /** Function that sends message */
  sendMessage: PropTypes.func.isRequired,
};

SendButton.themePath = 'messageInput';

export default themed(SendButton);
