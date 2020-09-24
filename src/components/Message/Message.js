import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import MessageSimple from './MessageSimple/MessageSimple';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useKeyboardContext } from '../../contexts/keyboardContext/KeyboardContext';
import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';

/**
 * Since this component doesn't consume `messages` from `MessagesContext`,
 * we memoized and broke it up to prevent new messages from re-rendering
 * each individual Message component.
 */
const DefaultMessageWithContext = React.memo((props) => {
  const {
    channel,
    client,
    disabled,
    dismissKeyboard,
    emojiData,
    message,
    Message = MessageSimple,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
  } = props;

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);

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

  const handleEdit = () => setEditingState(message);

  const handleDelete = async () => {
    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };

  // TODO: add flag/mute functionality to SDK
  const handleFlag = async () => await client.flagMessage(message.id);
  const handleMute = async () => await client.muteUser(message.user.id);

  const showActionSheet = async () => {
    await dismissKeyboard();
    setActionSheetVisible(true);
  };

  const openReactionPicker = async () => {
    if (disabled) return;
    /**
     * Keyboard closes automatically whenever modal is opened (currently there is no way of avoiding this afaik)
     * So we need to postpone the calculation for the reaction picker position until after the keyboard closes.
     * To achieve this, we close the keyboard forcefully and then calculate position of picker in callback.
     */
    await dismissKeyboard();
    setReactionPickerVisible(true);
  };

  const dismissReactionPicker = () => setReactionPickerVisible(false);

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
      setReactionPickerVisible(false);

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
      setReactionPickerVisible(true);
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
    <TouchableOpacity activeOpacity={1} testID='message-wrapper'>
      <Message
        {...props}
        {...actionProps}
        actionsEnabled={actionsEnabled}
        actionSheetVisible={actionSheetVisible}
        canDeleteMessage={canDeleteMessage}
        canEditMessage={canEditMessage}
        dismissReactionPicker={dismissReactionPicker}
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
        openReactionPicker={openReactionPicker}
        reactionPickerVisible={reactionPickerVisible}
        setActionSheetVisible={setActionSheetVisible}
        showActionSheet={showActionSheet}
      />
    </TouchableOpacity>
  );
});

DefaultMessageWithContext.displayName = 'messageWithContext';

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ../docs/Message.md
 */
const DefaultMessage = (props) => {
  const { channel, disabled } = useChannelContext();
  const { client } = useChatContext();
  const { dismissKeyboard } = useKeyboardContext();
  const {
    editing,
    emojiData,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
  } = useMessagesContext();

  return (
    <DefaultMessageWithContext
      {...props}
      {...{
        channel,
        client,
        disabled,
        dismissKeyboard,
        editing,
        emojiData,
        removeMessage,
        retrySendMessage,
        setEditingState,
        updateMessage,
      }}
    />
  );
};

DefaultMessage.propTypes = {
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
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: PropTypes.array,
  /** Latest message id on current channel */
  lastReceivedId: PropTypes.string,
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   * */
  Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object.isRequired,
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   */
  onThreadSelect: PropTypes.func,
  /** A list of users that have read this message **/
  readBy: PropTypes.array,
  /** Whether or not the MessageList is part of a Thread */
  threadList: PropTypes.bool,
};

DefaultMessage.themePath = 'message';

DefaultMessage.extraThemePaths = ['avatar'];

export default DefaultMessage;
