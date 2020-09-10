import React from 'react';
import { TouchableOpacity } from 'react-native';
import deepequal from 'deep-equal';
import PropTypes from 'prop-types';

import Attachment from '../Attachment/Attachment';
import MessageSimple from './MessageSimple/MessageSimple';

import { withKeyboardContext } from '../../context';
import { MESSAGE_ACTIONS } from '../../utils/utils';

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ../docs/Message.md
 * @extends Component
 */
const Message = withKeyboardContext(
  class Message extends React.Component {
    static themePath = 'message';
    static extraThemePaths = ['avatar'];
    constructor(props) {
      super(props);
      this.state = {
        loading: false,
      };
    }

    static propTypes = {
      /**
       * Attachment UI component to display attachment in individual message.
       * Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
       * */
      Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
      /** The current channel this message is displayed in */
      channel: PropTypes.object.isRequired,
      /** The client connection object for connecting to Stream */
      client: PropTypes.object.isRequired,
      /** Disables the message UI. Which means, message actions, reactions won't work. */
      disabled: PropTypes.bool,
      /** @see See [Keyboard Context](https://getstream.github.io/stream-chat-react-native/#keyboardcontext) */
      dismissKeyboard: PropTypes.func,
      /** Should keyboard be dismissed when messaged is touched */
      dismissKeyboardOnMessageTouch: PropTypes.bool,
      /** Editing, if the message is currently being edited */
      editing: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
      groupStyles: PropTypes.array,
      /** Latest message id on current channel */
      lastReceivedId: PropTypes.string,
      /** The message object */
      message: PropTypes.object.isRequired,
      /**
       * Message UI component to display a message in message list.
       * Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
       * */
      Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
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
       * */
      onMessageTouch: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      openThread: PropTypes.func,
      /** A list of users that have read this message **/
      readBy: PropTypes.array,
      /**
       * @deprecated Please use `disabled` instead.
       *
       * Disables the message UI. Which means, message actions, reactions won't work.
       */
      readOnly: PropTypes.bool,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      removeMessage: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      retrySendMessage: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      setEditingState: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      updateMessage: PropTypes.func,
    };

    static defaultProps = {
      Attachment,
      dismissKeyboardOnMessageTouch: true,
      editing: false,
      groupStyles: [],
      Message: MessageSimple,
      messageActions: Object.keys(MESSAGE_ACTIONS),
      readBy: [],
    };

    shouldComponentUpdate(nextProps) {
      // since there are many messages its important to only rerender messages when needed.
      let shouldUpdate = nextProps.message !== this.props.message;
      // read state is the next most likely thing to change..
      if (!shouldUpdate && !deepequal(nextProps.readBy, this.props.readBy)) {
        shouldUpdate = true;
      }
      // group style often changes for the last 3 messages...
      if (
        !shouldUpdate &&
        !deepequal(nextProps.groupStyles, this.props.groupStyles)
      ) {
        shouldUpdate = true;
      }

      // if lastreceivedId changes, message should update.
      if (
        !shouldUpdate &&
        !deepequal(nextProps.lastReceivedId, this.props.lastReceivedId)
      ) {
        shouldUpdate = true;
      }

      // editing is the last one which can trigger a change..
      if (!shouldUpdate && nextProps.editing !== this.props.editing) {
        shouldUpdate = true;
      }

      // editing is the last one which can trigger a change..
      if (!shouldUpdate && nextProps.disabled !== this.props.disabled) {
        shouldUpdate = true;
      }

      if (
        !shouldUpdate &&
        nextProps.dismissKeyboard !== this.props.dismissKeyboard
      ) {
        shouldUpdate = true;
      }

      return shouldUpdate;
    }

    isMyMessage = (message) => this.props.client.user.id === message.user.id;
    isAdmin = () =>
      this.props.client.user.role === 'admin' ||
      (this.props.channel.state &&
        this.props.channel.state.membership &&
        this.props.channel.state.membership.role === 'admin');
    isOwner = () =>
      this.props.channel.state &&
      this.props.channel.state.membership &&
      this.props.channel.state.membership.role === 'owner';
    isModerator = () =>
      this.props.channel.state &&
      this.props.channel.state.membership &&
      (this.props.channel.state.membership.role === 'channel_moderator' ||
        this.props.channel.state.membership.role === 'moderator');

    canEditMessage = () =>
      this.isMyMessage(this.props.message) ||
      this.isModerator() ||
      this.isOwner() ||
      this.isAdmin();

    canDeleteMessage = () => this.canEditMessage();

    handleFlag = async (event) => {
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      const message = this.props.message;
      await this.props.client.flagMessage(message.id);
    };

    handleMute = async (event) => {
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      const message = this.props.message;
      await this.props.client.flagMessage(message.user.id);
    };

    handleEdit = () => {
      this.props.setEditingState(this.props.message);
    };

    handleDelete = async () => {
      const message = this.props.message;
      const data = await this.props.client.deleteMessage(message.id);
      this.props.updateMessage(data.message);
    };

    handleReaction = async (reactionType, event) => {
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      let userExistingReaction = null;

      const currentUser = this.props.client.userID;
      for (const reaction of this.props.message.own_reactions) {
        // own user should only ever contain the current user id
        // just in case we check to prevent bugs with message updates from breaking reactions
        if (
          currentUser === reaction.user.id &&
          reaction.type === reactionType
        ) {
          userExistingReaction = reaction;
        } else if (currentUser !== reaction.user.id) {
          console.warn(
            `message.own_reactions contained reactions from a different user, this indicates a bug`,
          );
        }
      }

      const originalMessage = this.props.message;
      let reactionChangePromise;

      /*
    - Add the reaction to the local state
    - Make the API call in the background
    - If it fails, revert to the old message...
    */
      if (userExistingReaction) {
        this.props.channel.state.removeReaction(userExistingReaction);

        reactionChangePromise = this.props.channel.deleteReaction(
          this.props.message.id,
          userExistingReaction.type,
        );
      } else {
        // add the reaction
        const messageID = this.props.message.id;
        const tmpReaction = {
          created_at: new Date(),
          message_id: messageID,
          type: reactionType,
          user: this.props.client.user,
        };
        const reaction = { type: reactionType };

        this.props.channel.state.addReaction(tmpReaction);
        reactionChangePromise = this.props.channel.sendReaction(
          messageID,
          reaction,
        );
      }

      try {
        // only wait for the API call after the state is updated
        await reactionChangePromise;
      } catch (e) {
        // revert to the original message if the API call fails
        this.props.updateMessage(originalMessage);
      }
    };

    handleAction = async (name, value, event) => {
      if (event && event.preventDefault) {
        event.preventDefault();
      }
      const messageID = this.props.message.id;
      const formData = {};
      formData[name] = value;

      const data = await this.props.channel.sendAction(messageID, formData);

      if (data && data.message) {
        this.props.updateMessage(data.message);
      } else {
        this.props.removeMessage(this.props.message);
      }
    };

    handleRetry = async (message) => {
      await this.props.retrySendMessage(message);
    };

    onMessageTouch = (e, message) => {
      const {
        onMessageTouch,
        dismissKeyboardOnMessageTouch,
        dismissKeyboard,
      } = this.props;

      if (onMessageTouch) onMessageTouch(e, message);
      if (dismissKeyboardOnMessageTouch) dismissKeyboard();
    };

    getTotalReactionCount = (supportedReactions) => {
      const { emojiData } = this.props;
      let count = null;
      if (!supportedReactions) {
        supportedReactions = emojiData;
      }

      const reactionCounts = this.props.message.reaction_counts;

      if (
        reactionCounts !== null &&
        reactionCounts !== undefined &&
        Object.keys(reactionCounts).length > 0
      ) {
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

    render() {
      const message = this.props.message;

      const actionsEnabled =
        message.type === 'regular' && message.status === 'received';

      const Component = this.props.Message;
      const actionProps = {};

      if (this.props.channel && this.props.channel.getConfig()) {
        actionProps.reactionsEnabled = this.props.channel.getConfig().reactions;
        actionProps.repliesEnabled = this.props.channel.getConfig().reactions;
      }

      return (
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => {
            this.onMessageTouch(e, message);
          }}
        >
          <Component
            {...this.props}
            {...actionProps}
            actionsEnabled={actionsEnabled}
            canDeleteMessage={this.canDeleteMessage}
            canEditMessage={this.canEditMessage}
            channel={this.props.channel}
            client={this.props.client}
            getTotalReactionCount={this.getTotalReactionCount}
            handleAction={this.handleAction}
            handleDelete={this.handleDelete}
            handleEdit={this.handleEdit}
            handleFlag={this.handleFlag}
            handleMute={this.handleMute}
            handleReaction={this.handleReaction}
            handleRetry={this.handleRetry}
            isAdmin={this.isAdmin}
            isModerator={this.isModerator}
            isMyMessage={this.isMyMessage}
            Message={this}
            onMessageTouch={(e) => {
              this.onMessageTouch(e, message);
            }}
            openThread={
              this.props.openThread && this.props.openThread.bind(this, message)
            }
          />
        </TouchableOpacity>
      );
    }
  },
);

export default Message;
