import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Attachment } from './Attachment';
import { MessageSimple } from './MessageSimple';
import PropTypes from 'prop-types';
import deepequal from 'deep-equal';
import { withKeyboardContext } from '../context';
import { MESSAGE_ACTIONS } from '../utils';

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./docs/Message.md
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
      /** The message object */
      message: PropTypes.object.isRequired,
      /** The client connection object for connecting to Stream */
      client: PropTypes.object.isRequired,
      /** The current channel this message is displayed in */
      channel: PropTypes.object.isRequired,
      /** A list of users that have read this message **/
      readBy: PropTypes.array,
      /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
      groupStyles: PropTypes.array,
      /** Editing, if the message is currently being edited */
      editing: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      /**
       * Message UI component to display a message in message list.
       * Avaialble from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
       * */
      Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * Attachment UI component to display attachment in individual message.
       * Avaialble from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
       * */
      Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
       * If all the actions need to be disabled, empty array or false should be provided as value of prop.
       * */
      messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
      /** Latest message id on current channel */
      lastReceivedId: PropTypes.string,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      setEditingState: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      updateMessage: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      removeMessage: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      retrySendMessage: PropTypes.func,
      /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
      openThread: PropTypes.func,
      /** @see See [Keyboard Context](https://getstream.github.io/stream-chat-react-native/#keyboardcontext) */
      dismissKeyboard: PropTypes.func,
      /**
       * Callback for onPress event on Message component
       *
       * @param e       Event object for onPress event
       * @param message Message object which was pressed
       *
       * */
      onMessageTouch: PropTypes.func,
      /** Should keyboard be dismissed when messaged is touched */
      dismissKeyboardOnMessageTouch: PropTypes.bool,
    };

    static defaultProps = {
      Message: MessageSimple,
      messageActions: Object.keys(MESSAGE_ACTIONS),
      readBy: [],
      groupStyles: [],
      Attachment,
      editing: false,
      dismissKeyboardOnMessageTouch: true,
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

      // if lastreceivedId changesm, message should update.
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

      return shouldUpdate;
    }

    isMyMessage = (message) => this.props.client.user.id === message.user.id;
    isAdmin = () => this.props.client.user.role === 'admin';

    canEditMessage = () =>
      this.isMyMessage(this.props.message) || this.isAdmin();

    canDeleteMessage = () =>
      this.isMyMessage(this.props.message) || this.isAdmin();

    handleFlag = async (event) => {
      event.preventDefault();

      const message = this.props.message;
      await this.props.client.flagMessage(message.id);
    };

    handleMute = async (event) => {
      event.preventDefault();

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
      if (event !== undefined && event.preventDefault) {
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
          message_id: messageID,
          user: this.props.client.user,
          type: reactionType,
          created_at: new Date(),
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
      event.preventDefault();
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

    getTotalReactionCount = () => {
      const { emojiData } = this.props;
      let count = null;
      const reactionCounts = this.props.message.reaction_counts;

      if (
        reactionCounts !== null &&
        reactionCounts !== undefined &&
        Object.keys(reactionCounts).length > 0
      ) {
        count = 0;
        Object.keys(reactionCounts).map((key) => {
          if (emojiData.find((e) => e.id === key)) {
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
          onPress={(e) => {
            this.onMessageTouch(e, message);
          }}
          activeOpacity={1}
        >
          <Component
            {...this.props}
            {...actionProps}
            client={this.props.client}
            channel={this.props.channel}
            actionsEnabled={actionsEnabled}
            Message={this}
            onMessageTouch={(e) => {
              this.onMessageTouch(e, message);
            }}
            handleReaction={this.handleReaction}
            getTotalReactionCount={this.getTotalReactionCount}
            handleFlag={this.handleFlag}
            handleMute={this.handleMute}
            handleAction={this.handleAction}
            handleRetry={this.handleRetry}
            isMyMessage={this.isMyMessage}
            isAdmin={this.isAdmin}
            canEditMessage={this.canEditMessage}
            canDeleteMessage={this.canDeleteMessage}
            handleEdit={this.handleEdit}
            handleDelete={this.handleDelete}
            openThread={
              this.props.openThread && this.props.openThread.bind(this, message)
            }
          />
        </TouchableOpacity>
      );
    }
  },
);

export { Message };
