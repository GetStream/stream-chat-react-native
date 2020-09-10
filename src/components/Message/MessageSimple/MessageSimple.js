import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import DefaultMessageAvatar from './MessageAvatar';
import DefaultMessageContent from './MessageContent';
import DefaultMessageStatus from './MessageStatus';

import { themed } from '../../../styles/theme';
import { ChannelContext } from '../../../context';

const Container = styled.View`
  align-items: flex-end;
  flex-direction: row;
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  margin-bottom: ${({ hasMarginBottom, isVeryLastMessage }) =>
    hasMarginBottom ? (isVeryLastMessage ? 30 : 20) : 0}px;
  ${({ theme }) => theme.message.container.css}
`;

/**
 *
 * Message UI component
 *
 * @example ../../docs/MessageSimple.md
 */
const MessageSimple = (props) => {
  const {
    forceAlign = false,
    groupStyles,
    isMyMessage,
    message,
    MessageAvatar = DefaultMessageAvatar,
    MessageContent = DefaultMessageContent,
    MessageStatus = DefaultMessageStatus,
    reactionsEnabled = true,
    showMessageStatus = true,
  } = props;

  const { channel } = useContext(ChannelContext);

  const customMessageContent = !!props.MessageContent;

  let alignment;
  if (forceAlign && (forceAlign === 'left' || forceAlign === 'right')) {
    alignment = forceAlign;
  } else {
    alignment = isMyMessage(message) ? 'right' : 'left';
  }

  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
  const isVeryLastMessage = lastMessage && lastMessage.id === message.id;
  const hasMarginBottom =
    groupStyles[0] === 'single' || groupStyles[0] === 'bottom';
  const hasReactions =
    reactionsEnabled &&
    message.latest_reactions &&
    message.latest_reactions.length > 0;

  const forwardedProps = {
    ...props,
    alignment,
    customMessageContent,
    groupStyles: hasReactions ? ['bottom'] : groupStyles,
  };

  return (
    <Container
      alignment={alignment}
      hasMarginBottom={hasMarginBottom}
      isVeryLastMessage={isVeryLastMessage}
      testID='message-simple-wrapper'
    >
      {alignment === 'right' ? (
        <>
          <MessageContent {...forwardedProps} />
          <MessageAvatar {...forwardedProps} />
          {showMessageStatus && <MessageStatus {...forwardedProps} />}
        </>
      ) : (
        <>
          <MessageAvatar {...forwardedProps} />
          <MessageContent {...forwardedProps} />
        </>
      )}
    </Container>
  );
};

MessageSimple.propTypes = {
  /**
   * Custom UI component for the action sheet that appears on long press of a Message.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageActionSheet.js
   *
   * Wrap your action sheet component in `React.forwardRef` to gain access to the `actionSheetRef` set in MessageContent.
   */
  ActionSheet: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Style object for action sheet (used to message actions).
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles: PropTypes.object,
  /**
   * Whether or not to show the action sheet
   */
  actionSheetVisible: PropTypes.bool,
  /**
   * Provide any additional props for `TouchableOpacity` which wraps inner MessageContent component here.
   * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
   */
  additionalTouchableProps: PropTypes.object,
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
   */
  AttachmentActions: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Function that returns a boolean indicating whether or not the user can delete the message.
   */
  canDeleteMessage: PropTypes.func,
  /**
   * Function that returns a boolean indicating whether or not the user can edit the message.
   */
  canEditMessage: PropTypes.func,
  /**
   * Custom UI component to display generic media type e.g. giphy, url preview etc
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Card: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /** Dismiss the reaction picker */
  dismissReactionPicker: PropTypes.func,
  /**
   * Whether or not users are able to long press messages.
   */
  enableLongPress: PropTypes.bool,
  /**
   * Custom UI component to display File type attachment.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachment.js
   */
  FileAttachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachmentGroup.js
   */
  FileAttachmentGroup: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Force alignment of message to left or right - 'left' | 'right'
   * By default, current user's messages will be aligned to right and other user's messages will be aligned to left.
   * */
  forceAlign: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  formatDate: PropTypes.func,
  /**
   * Custom UI component to display image attachments.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Gallery.js
   */
  Gallery: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to display Giphy image.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Giphy: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: PropTypes.array,
  /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
  handleAction: PropTypes.func,
  /**
   * Handler to delete a current message.
   */
  handleDelete: PropTypes.func,
  /**
   * Handler to edit a current message. This function sets the current message as the `editing` property of channel context.
   * The `editing` prop is used by the MessageInput component to switch to edit mode.
   */
  handleEdit: PropTypes.func,
  /** Handler to flag the message */
  handleFlag: PropTypes.func,
  /** Handler to mute the user */
  handleMute: PropTypes.func,
  /** Handler to resend the message */
  handleRetry: PropTypes.func,
  /** enable hiding reaction count from reaction picker  */
  hideReactionCount: PropTypes.bool,
  /** enable hiding reaction owners from reaction picker */
  hideReactionOwners: PropTypes.bool,
  /**
   * Returns true if message (param) belongs to current user, else false
   *
   * @param message
   * */
  isMyMessage: PropTypes.func,
  /** Boolean if current message is part of thread */
  isThreadList: PropTypes.bool,
  /** Latest message id on current channel */
  lastReceivedId: PropTypes.string,
  /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
  markdownRules: PropTypes.object,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  /**
   * Custom UI component for the avatar next to a message
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageAvatar.js
   * */
  MessageAvatar: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component for message content
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageContent.js
   * */
  MessageContent: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component for message status (delivered/read)
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageStatus.js
   *
   * */
  MessageStatus: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /** Custom UI component for message text */
  MessageText: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
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
   *      onLongPress={(message, e) => {
   *        props.openReactionPicker();
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
   * @param message Message object which was long pressed
   * @param e       Event object for onLongPress event
   * */
  onLongPress: PropTypes.func,
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
   *      onPress={(message, e) => {
   *        openReactionPicker();
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
   * @param message Message object which was pressed
   * @param e       Event object for onPress event
   * */
  onPress: PropTypes.func,
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   */
  onThreadSelect: PropTypes.func,
  /** Open the reaction picker */
  openReactionPicker: PropTypes.func,
  /**
   * Custom UI component to display reaction list.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/ReactionList.js
   */
  ReactionList: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /** Whether or not the reaction picker is visible */
  reactionPickerVisible: PropTypes.bool,
  /** enabled reactions, this is usually set by the parent component based on channel configs */
  reactionsEnabled: PropTypes.bool,
  /** A list of users who have read the message */
  readBy: PropTypes.array,
  /** enabled replies, this is usually set by the parent component based on channel configs */
  repliesEnabled: PropTypes.bool,
  /**
   * React useState hook setter function that toggles action sheet visibility
   */
  setActionSheetVisible: PropTypes.func,
  showMessageStatus: PropTypes.bool,
  showReactionsList: PropTypes.bool,
  /**
   * e.g.,
   * [
   *  {
   *    id: 'like',
   *    icon: '👍',
   *  },
   *  {
   *    id: 'love',
   *    icon: '❤️️',
   *  },
   *  {
   *    id: 'haha',
   *    icon: '😂',
   *  },
   *  {
   *    id: 'wow',
   *    icon: '😮',
   *  },
   * ]
   */
  supportedReactions: PropTypes.array,
  /**
   * Custom UI component to display enriched url preview.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  UrlPreview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

MessageSimple.themePath = 'message';

export default themed(MessageSimple);
