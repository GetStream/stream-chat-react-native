import React from 'react';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';

import { MessageAvatar as DefaultMessageAvatar } from './MessageAvatar';
import { MessageContent as DefaultMessageContent } from './MessageContent';
import { MessageStatus as DefaultMessageStatus } from './MessageStatus';
import { MessageSystem as DefaultMessageSystem } from '../MessageSystem';

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
      /**
       * Custom UI component for the avatar next to a message
       * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageAvatar.js
       * */
      MessageAvatar: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.elementType,
      ]),
      /**
       * Custom UI component for message content
       * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageContent.js
       * */
      MessageContent: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.elementType,
      ]),
      /**
       * Custom UI component for message status (delivered/read)
       * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageStatus.js
       *
       * */
      MessageStatus: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.elementType,
      ]),
      /**
       * Custom UI component for Messages of type "system"
       * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSystem.js
       * */
      MessageSystem: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.elementType,
      ]),
      /** Custom UI component for message text */
      MessageText: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
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
       * Callback for onPress event on Message component
       *
       * @param e       Event object for onPress event
       * @param message Message object which was pressed
       *
       * @deprecated Use onPress instead
       * */
      onMessageTouch: PropTypes.func,
      /**
       * Function that overrides default behaviour when message is pressed/touched
       * e.g. if you would like to open reaction picker on message press:
       *
       * ```
       * import { MessageSimple } from 'stream-chat-react-native' // or 'stream-chat-expo'
       * ...
       * const MessageUIComponent = (props) => {
       *  return (
       *    <MessageSimple
       *      {...props}
       *      onPress={(thisArg, message, e) => {
       *        thisArg.openReactionSelector();
       *      }}
       *  )
       * }
       * ```
       *
       * Similarly, you can also call other methods available on MessageContent
       * component such as handleEdit, handleDelete, showActionSheet etc.
       *
       * Source - [MessageContent](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageContent.js)
       *
       * @param {Component} thisArg Reference to MessageContent component
       * @param message Message object which was pressed
       * @param e       Event object for onPress event
       * */
      onPress: PropTypes.func,
      /**
       * Function that overrides default behaviour when message is long pressed
       * e.g. if you would like to open reaction picker on message long press:
       *
       * ```
       * import { MessageSimple } from 'stream-chat-react-native' // or 'stream-chat-expo'
       * ...
       * const MessageUIComponent = (props) => {
       *  return (
       *    <MessageSimple
       *      {...props}
       *      onLongPress={(thisArg, message, e) => {
       *        thisArg.openReactionSelector();
       *      }}
       *  )
       * }
       *
       * Similarly, you can also call other methods available on MessageContent
       * component such as handleEdit, handleDelete, showActionSheet etc.
       *
       * Source - [MessageContent](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageContent.js)
       * ```
       *
       * By default we show action sheet with all the message actions on long press.
       *
       * @param {Component} thisArg Reference to MessageContent component
       * @param message Message object which was long pressed
       * @param e       Event object for onLongPress event
       * */
      onLongPress: PropTypes.func,
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
      /** Handler resend the message. */
      handleRetry: PropTypes.func,
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
      /**
       * Force alignment of message to left or right - 'left' | 'right'
       * By default, current user's messages will be aligned to right and other user's messages will be aligned to left.
       * */
      forceAlign: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
      showMessageStatus: PropTypes.bool,
      /** Latest message id on current channel */
      lastReceivedId: PropTypes.string,
      /**
       * Style object for actionsheet (used to message actions).
       * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
       */
      actionSheetStyles: PropTypes.object,
      /**
       * Custom UI component for attachment icon for type 'file' attachment.
       * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
       */
      AttachmentFileIcon: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.elementType,
      ]),
      formatDate: PropTypes.func,
    };

    static defaultProps = {
      reactionsEnabled: true,
      repliesEnabled: true,
      forceAlign: false,
      showMessageStatus: true,
      MessageAvatar: DefaultMessageAvatar,
      MessageContent: DefaultMessageContent,
      MessageStatus: DefaultMessageStatus,
      MessageSystem: DefaultMessageSystem,
    };

    static themePath = 'message';

    render() {
      const {
        message,
        isMyMessage,
        groupStyles,
        forceAlign,
        showMessageStatus,
        MessageAvatar,
        MessageContent,
        MessageStatus,
        MessageSystem,
      } = this.props;

      let pos;
      if ((forceAlign && forceAlign === 'left') || forceAlign === 'right')
        pos = forceAlign;
      else pos = isMyMessage(message) ? 'right' : 'left';

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
          {pos === 'right' ? (
            <React.Fragment>
              <MessageContent {...this.props} alignment={pos} />
              <MessageAvatar {...this.props} />
              {showMessageStatus && <MessageStatus {...this.props} />}
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
