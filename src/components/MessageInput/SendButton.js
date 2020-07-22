import React from 'react';
import styled from '@stream-io/styled-components';

import { themed } from '../../styles/theme';
import iconEdit from '../../images/icons/icon_edit.png';
import iconSendNewMessage from '../../images/icons/icon_new_message.png';

import PropTypes from 'prop-types';

const Container = styled.TouchableOpacity`
  margin-left: 8;
  ${({ theme }) => theme.messageInput.sendButton.css}
`;

const SendButtonIcon = styled.Image`
  width: 15;
  height: 15;
  ${({ theme }) => theme.messageInput.sendButtonIcon.css}
`;

/**
 * UI Component for send button in MessageInput component.
 *
 * @extends PureComponent
 * @example ./docs/SendButton.md
 */
class SendButton extends React.PureComponent {
  static themePath = 'messageInput';
  static propTypes = {
    title: PropTypes.string,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    editing: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    /** Function that sends message */
    sendMessage: PropTypes.func.isRequired,
    /** Disables the button */
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    disabled: false,
  };

  render() {
    const { sendMessage, editing, title, disabled } = this.props;
    return (
      <Container title={title} onPress={sendMessage} disabled={disabled}>
        {editing ? (
          <SendButtonIcon source={iconEdit} />
        ) : (
          <SendButtonIcon source={iconSendNewMessage} />
        )}
      </Container>
    );
  }
}

export default themed(SendButton);
