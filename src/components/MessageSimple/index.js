import React from 'react';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';

import { MessageStatus } from './MessageStatus';
import { MessageContent } from './MessageContent';
import { MessageAvatar } from './MessageAvatar';
import { MessageSystem } from '../MessageSystem';

import PropTypes from 'prop-types';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  margin-bottom: ${({ hasMarginBottom, isVeryLastMessage }) =>
    hasMarginBottom ? (isVeryLastMessage ? 30 : 20) : 0};
  ${({ theme }) => theme.message.container.css}
`;

/**
 *
 * Message UI component
 *
 * @example ../docs/MessageSimple.md
 * @extends Component
 */

export const MessageSimple = themed(
  class MessageSimple extends React.PureComponent {
    static propTypes = {
      /** enabled reactions, this is usually set by the parent component based on channel configs */
      reactionsEnabled: PropTypes.bool.isRequired,
      /** enabled replies, this is usually set by the parent component based on channel configs */
      repliesEnabled: PropTypes.bool.isRequired,
      /**
       * Handler to open the thread on message. This is callback for touch event for replies button.
       *
       * @param message A message object to open the thread upon.
       * */
      onThreadSelect: PropTypes.func,
      /**
       * Callback handler for onPress event on message component
       */
      onMessageTouch: PropTypes.func,
      /**
       * Handler to delete a current message.
       */
      handleDelete: PropTypes.func,
      /**
       * Handler to edit a current message. This message simply sets current message as value of `editing` property of channel context.
       * `editing` prop is then used by MessageInput component to switch to edit mode.
       */
      handleEdit: PropTypes.func,
      /** @see See [keyboard context](https://getstream.io/chat/docs/#keyboardcontext) */
      dismissKeyboard: PropTypes.func,
      /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
      handleAction: PropTypes.func,
      /** Current [message object](https://getstream.io/chat/docs/#message_format) */
      message: PropTypes.object,
      /**
       * Returns true if message (param) belongs to current user, else false
       *
       * @param message
       * */
      isMyMessage: PropTypes.func,
      /**
       * Position of message in group - top, bottom, middle, single.
       *
       * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
       * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
       */
      groupStyles: PropTypes.array,
      /** Boolean if current message is part of thread */
      isThreadList: PropTypes.bool,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      openThread: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      client: PropTypes.object,
      /** A list of users who have read the message */
      readBy: PropTypes.array,
      /** Latest message id on current channel */
      lastReceivedId: PropTypes.string,
    };

    static defaultProps = {
      reactionsEnabled: true,
      repliesEnabled: true,
    };

    static themePath = 'message';

    render() {
      const { message, isMyMessage, groupStyles } = this.props;
      const pos = isMyMessage(message) ? 'right' : 'left';
      const lastMessage = this.props.channel.state.messages[
        this.props.channel.state.messages.length - 1
      ];
      const isVeryLastMessage = lastMessage
        ? lastMessage.id === message.id
        : false;
      const hasMarginBottom =
        groupStyles[0] === 'single' || groupStyles[0] === 'bottom'
          ? true
          : false;

      if (message.type === 'system') {
        return <MessageSystem message={message} />;
      }

      return (
        <Container
          alignment={pos}
          hasMarginBottom={hasMarginBottom}
          isVeryLastMessage={isVeryLastMessage}
        >
          {isMyMessage(message) ? (
            <React.Fragment>
              <MessageContent {...this.props} alignment={pos} />
              <MessageAvatar {...this.props} />
              <MessageStatus {...this.props} />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <MessageAvatar {...this.props} />
              <MessageContent {...this.props} alignment={pos} />
            </React.Fragment>
          )}
        </Container>
      );
    }
  },
);

export { MessageStatus } from './MessageStatus';
export { MessageContent } from './MessageContent';
export { MessageAvatar } from './MessageAvatar';
export { MessageTextContainer } from './MessageTextContainer';
