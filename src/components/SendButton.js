import React from 'react';
import styled from '@stream-io/styled-components';
import iconEdit from '../images/icons/icon_edit.png';
import iconSendNewMessage from '../images/icons/icon_new_message.png';
import { themed } from '../styles/theme';
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
export const SendButton = themed(
  class SendButton extends React.PureComponent {
    static themePath = 'messageInput';
    static propTypes = {
      title: PropTypes.string,
      /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      editing: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      /** Function that sends message */
      sendMessage: PropTypes.func.isRequired,
      /** Custom Icon for sending New message **/
      newMessageIcon: PropTypes.oneOfType([
        PropTypes.shape({
          uri: PropTypes.string,
          headers: PropTypes.objectOf(PropTypes.string),
        }),
        PropTypes.number,
        PropTypes.arrayOf(
          PropTypes.shape({
            uri: PropTypes.string,
            width: PropTypes.number,
            height: PropTypes.number,
            headers: PropTypes.objectOf(PropTypes.string),
          }),
        ),
      ]),
      /** Custom Icon for editing message **/
      editMessageIcon: PropTypes.oneOfType([
        PropTypes.shape({
          uri: PropTypes.string,
          headers: PropTypes.objectOf(PropTypes.string),
        }),
        PropTypes.number,
        PropTypes.arrayOf(
          PropTypes.shape({
            uri: PropTypes.string,
            width: PropTypes.number,
            height: PropTypes.number,
            headers: PropTypes.objectOf(PropTypes.string),
          }),
        ),
      ]),
    };
    render() {
      const {
        sendMessage,
        editing,
        title,
        editMessageIcon,
        newMessageIcon,
      } = this.props;
      return (
        <Container title={title} onPress={sendMessage}>
          {editing ? (
            <SendButtonIcon source={editMessageIcon || iconEdit} />
          ) : (
            <SendButtonIcon source={newMessageIcon || iconSendNewMessage} />
          )}
        </Container>
      );
    }
  },
);
