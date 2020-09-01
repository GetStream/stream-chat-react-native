import React, { useContext } from 'react';
import { TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import MessageSimple from './MessageSimple/MessageSimple';

import {
  ChannelContext,
  ChatContext,
  KeyboardContext,
  MessagesContext,
} from '../../context';

/**
 * Since this component doesn't consume `messages` from `MessagesContext`,
 * we memoized and broke it up to prevent new messages from re-rendering
 * each individual Message component.
 */
const MessageWithContext = React.memo((props) => {
  const {
    channel,
    dismissKeyboard,
    dismissKeyboardOnMessageTouch = true,
    emojiData,
    message,
    Message,
    onMessageTouch: onMessageTouchProp,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
  } = props;

  const { client } = useContext(ChatContext);

  const isMyMessage = (message) => client.user.id === message.user.id;

  const isAdmin = () =>
    client.user.role === 'admin' ||
    (channel.state &&
      channel.state.membership &&
      channel.state.membership.role === 'admin');

  const isOwner = () =>
    channel.state &&
    channel.state.membership &&
    channel.state.membership.role === 'owner';

  const isModerator = () =>
    channel.state &&
    channel.state.membership &&
    (channel.state.membership.role === 'channel_moderator' ||
      channel.state.membership.role === 'moderator');

  const canEditMessage = () =>
    isMyMessage(message) || isModerator() || isOwner() || isAdmin();

  const canDeleteMessage = () => canEditMessage();

  const handleFlag = async () => await client.flagMessage(message.id);

  const handleMute = async () => await client.flagMessage(message.user.id);

  const handleEdit = () => setEditingState(message);

  const handleDelete = async () => {
    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };

  const handleReaction = async (reactionType) => {
    let userExistingReaction;

    for (const reaction of message.own_reactions) {
      /**
       * Own user should only ever contain the current user id, just in
       * case we check to prevent bugs with message updates from breaking reactions
       */
      if (
        client.userID === reaction.user.id &&
        reaction.type === reactionType
      ) {
        userExistingReaction = reaction;
      } else if (client.userID !== reaction.user.id) {
        console.warn(
          `message.own_reactions contained reactions from a different user, this indicates a bug`,
        );
      }
    }

    // Add reaction to local state, make API call in background, revert to old message if fails
    try {
      if (userExistingReaction) {
        channel.state.removeReaction(userExistingReaction);
        await channel.deleteReaction(message.id, userExistingReaction.type);
      } else {
        const tmpReaction = {
          created_at: new Date(),
          message_id: message.id,
          type: reactionType,
          user: client.user,
        };

        channel.state.addReaction(tmpReaction);
        await channel.sendReaction(message.id, { type: reactionType });
      }
    } catch (e) {
      updateMessage(message);
    }
  };

  const handleAction = async (name, value) => {
    const data = await channel.sendAction(message.id, { name: value });
    if (data && data.message) {
      updateMessage(data.message);
    } else {
      removeMessage(message);
    }
  };

  const handleRetry = async (message) => await retrySendMessage(message);

  const onMessageTouch = (e, message) => {
    if (onMessageTouchProp) {
      onMessageTouchProp(e, message);
    }
    if (dismissKeyboardOnMessageTouch) {
      dismissKeyboard();
    }
  };

  const getTotalReactionCount = (supportedReactions) => {
    let count;
    if (!supportedReactions) {
      supportedReactions = emojiData;
    }

    const reactionCounts = message.reaction_counts;

    if (reactionCounts && Object.keys(reactionCounts).length > 0) {
      count = 0;
      Object.keys(reactionCounts).map((key) => {
        if (supportedReactions.find((e) => e.id === key)) {
          count += reactionCounts[key];
        }
        return count;
      });
    }
    return count;
  };

  const actionsEnabled =
    message.type === 'regular' && message.status === 'received';

  const actionProps = {};

  if (channel && channel.getConfig()) {
    actionProps.reactionsEnabled = channel.getConfig().reactions;
    actionProps.repliesEnabled = channel.getConfig().reactions;
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={(e) => onMessageTouch(e, message)}
    >
      <Message
        {...props}
        {...actionProps}
        actionsEnabled={actionsEnabled}
        canDeleteMessage={canDeleteMessage}
        canEditMessage={canEditMessage}
        getTotalReactionCount={getTotalReactionCount}
        handleAction={handleAction}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handleReaction={handleReaction}
        handleRetry={handleRetry}
        isAdmin={isAdmin}
        isModerator={isModerator}
        isMyMessage={isMyMessage}
        onMessageTouch={(e) => onMessageTouch(e, message)}
      />
    </TouchableOpacity>
  );
});

MessageWithContext.displayName = 'messageWithContext';

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ../docs/Message.md
 */
const Message = (props) => {
  const { Message = MessageSimple, channel } = useContext(ChannelContext);
  const {
    editing,
    emojiData,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
  } = useContext(MessagesContext);
  const { dismissKeyboard } = useContext(KeyboardContext);

  return (
    <MessageWithContext
      {...props}
      {...{
        channel,
        dismissKeyboard,
        editing,
        emojiData,
        Message,
        removeMessage,
        retrySendMessage,
        setEditingState,
        updateMessage,
      }}
    />
  );
};

Message.propTypes = {
  /**
   * Style object for action sheet (used to message actions).
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
  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch: PropTypes.bool,
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: PropTypes.array,
  /** Latest message id on current channel */
  lastReceivedId: PropTypes.string,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object.isRequired,
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
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
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   */
  onThreadSelect: PropTypes.func,
  /** A list of users that have read this message **/
  readBy: PropTypes.array,
  /**
   * @deprecated Please use `disabled` instead.
   *
   * Disables the message UI. Which means, message actions, reactions won't work.
   */
  readOnly: PropTypes.bool,
  /** Whether or not the MessageList is part of a Thread */
  threadList: PropTypes.bool,
};

Message.themePath = 'message';

Message.extraThemePaths = ['avatar'];

export default Message;
