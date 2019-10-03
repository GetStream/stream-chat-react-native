import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';
import { ChannelContext } from '../context';
import { SuggestionsProvider } from './SuggestionsProvider';

import uuidv4 from 'uuid/v4';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { emojiData } from '../utils';

import { LoadingIndicator } from './LoadingIndicator';
import { LoadingErrorIndicator } from './LoadingErrorIndicator';
import { EmptyStateIndicator } from './EmptyStateIndicator';
import { KeyboardCompatibleView } from './KeyboardCompatibleView';
import { logChatPromiseExecution } from 'stream-chat';

/**
 * This component is not really exposed externally, and is only supposed to be used with
 * 'Channel' component (which is actually exposed to customers).
 */
export class ChannelInner extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      // Loading the intial content of the channel
      loading: true,
      // Loading more messages
      loadingMore: false,
      hasMore: true,
      messages: Immutable([]),
      online: props.isOnline,
      typing: Immutable({}),
      watchers: Immutable({}),
      members: Immutable({}),
      read: Immutable({}),
      thread: props.thread,
      threadMessages: [],
      threadLoadingMore: false,
      threadHasMore: true,
      kavEnabled: true,
      /** We save the events in state so that we can display event message
       * next to the message after which it was received, in MessageList.
       *
       * e.g., eventHistory = {
       *   message_id_1: [
       *     { ...event_obj_received_after_message_id_1__1 },
       *     { ...event_obj_received_after_message_id_1__2 },
       *     { ...event_obj_received_after_message_id_1__3 },
       *   ],
       *   message_id_2: [
       *     { ...event_obj_received_after_message_id_2__1 },
       *     { ...event_obj_received_after_message_id_2__2 },
       *     { ...event_obj_received_after_message_id_2__3 },
       *   ]
       * }
       */
      eventHistory: {},
    };

    // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
    this._loadMoreFinishedDebounced = debounce(this.loadMoreFinished, 2000, {
      leading: true,
      trailing: true,
    });

    this._loadMoreThrottled = throttle(this.loadMore, 2000, {
      leading: true,
      trailing: true,
    });

    // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
    this._loadMoreThreadFinishedDebounced = debounce(
      this.loadMoreThreadFinished,
      2000,
      {
        leading: true,
        trailing: true,
      },
    );

    this._setStateThrottled = throttle(this.setState, 500, {
      leading: true,
      trailing: true,
    });

    this._markReadThrottled = throttle(this.markRead, 500, {
      leading: true,
      trailing: true,
    });

    this.messageInputBox = false;
  }

  static propTypes = {
    /** Which channel to connect to */
    channel: PropTypes.shape({
      watch: PropTypes.func,
    }).isRequired,
    /** Client is passed via the Chat Context */
    client: PropTypes.object.isRequired,
    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** The indicator to use when there is error  */
    LoadingErrorIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func,
    ]),
    /** The indicator to use when message list is empty */
    EmptyStateIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    isOnline: PropTypes.bool,
    Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  static defaultProps = {
    LoadingIndicator,
    LoadingErrorIndicator,
    EmptyStateIndicator,
    emojiData,
  };

  componentDidUpdate(prevProps) {
    if (this.props.isOnline !== prevProps.isOnline) {
      if (this._unmounted) return;
      this.setState({ online: this.props.isOnline });
    }
  }

  async componentDidMount() {
    const channel = this.props.channel;
    let errored = false;
    if (!channel.initialized) {
      try {
        await channel.watch();
      } catch (e) {
        if (this._unmounted) return;
        this.setState({ error: true });
        errored = true;
      }
    }

    this.lastRead = new Date();
    if (!errored) {
      this.copyChannelState();
      this.listenToChanges();
    }
  }

  componentWillUnmount() {
    this.props.channel.off(this.handleEvent);
    this.props.client.off('connection.recovered', this.handleEvent);

    this._loadMoreFinishedDebounced.cancel();
    this._loadMoreThreadFinishedDebounced.cancel();
    this._setStateThrottled.cancel();
    this._unmounted = true;
  }

  copyChannelState() {
    const channel = this.props.channel;

    if (this._unmounted) return;
    this.setState({
      messages: channel.state.messages,
      read: channel.state.read,
      watchers: channel.state.watchers,
      members: channel.state.members,
      watcher_count: channel.state.watcher_count,
      loading: false,
      typing: Immutable({}),
    });

    if (channel.countUnread() > 0) this.markRead();
  }

  markRead = () => {
    if (!this.props.channel.getConfig().read_events) {
      return;
    }
    logChatPromiseExecution(this.props.channel.markRead(), 'mark read');
  };

  listenToChanges() {
    // The more complex sync logic is done in chat.js
    // listen to client.connection.recovered and all channel events
    this.props.client.on('connection.recovered', this.handleEvent);
    const channel = this.props.channel;
    channel.on(this.handleEvent);
  }

  openThread = (message) => {
    const channel = this.props.channel;
    const threadMessages = channel.state.threads[message.id] || [];

    if (this._unmounted) return;
    this.setState({
      thread: message,
      threadMessages,
    });
  };

  loadMoreThread = async () => {
    // prevent duplicate loading events...
    if (this.state.threadLoadingMore) return;
    if (this._unmounted) return;
    this.setState({
      threadLoadingMore: true,
    });
    const channel = this.props.channel;
    const parentID = this.state.thread.id;
    const oldMessages = channel.state.threads[parentID] || [];
    const oldestMessageID = oldMessages[0] ? oldMessages[0].id : null;
    const limit = 50;
    const queryResponse = await channel.getReplies(parentID, {
      limit,
      id_lt: oldestMessageID,
    });
    const hasMore = queryResponse.messages.length === limit;

    const threadMessages = channel.state.threads[parentID] || [];

    // next set loadingMore to false so we can start asking for more data...
    this._loadMoreThreadFinishedDebounced(hasMore, threadMessages);
  };

  loadMoreThreadFinished = (threadHasMore, threadMessages) => {
    if (this._unmounted) return;
    this.setState({
      threadLoadingMore: false,
      threadHasMore,
      threadMessages,
    });
  };

  closeThread = () => {
    if (this._unmounted) return;
    this.setState({
      thread: null,
      threadMessages: [],
    });
  };

  setEditingState = (message) => {
    if (this._unmounted) return;
    this.setState({
      editing: message,
    });
  };

  updateMessage = (updatedMessage, extraState) => {
    const channel = this.props.channel;

    extraState = extraState || {};

    // adds the message to the local channel state..
    // this adds to both the main channel state as well as any reply threads
    channel.state.addMessageSorted(updatedMessage);

    // update the Channel component state
    if (this.state.thread && updatedMessage.parent_id) {
      extraState.threadMessages =
        channel.state.threads[updatedMessage.parent_id] || [];
    }
    if (this._unmounted) return;
    this.setState({ messages: channel.state.messages, ...extraState });
  };

  clearEditingState = () => {
    if (this._unmounted) return;
    this.setState({
      editing: false,
    });
  };
  removeMessage = (message) => {
    const channel = this.props.channel;
    channel.state.removeMessage(message);
    if (this._unmounted) return;
    this.setState({ messages: channel.state.messages });
  };

  removeEphemeralMessages() {
    const c = this.props.channel;
    c.state.selectRegularMessages();
    if (this._unmounted) return;
    this.setState({ messages: c.state.messages });
  }

  createMessagePreview = (
    text,
    attachments,
    parent,
    mentioned_users,
    extraFields,
  ) => {
    // create a preview of the message
    const clientSideID = `${this.props.client.userID}-` + uuidv4();
    const message = {
      text,
      html: text,
      __html: text,
      //id: tmpID,
      id: clientSideID,
      type: 'regular',
      status: 'sending',
      user: {
        id: this.props.client.userID,
        ...this.props.client.user,
      },
      created_at: new Date(),
      attachments,
      mentioned_users,
      reactions: [],
      ...extraFields,
    };

    if (parent && parent.id) {
      message.parent_id = parent.id;
    }
    return message;
  };

  _sendMessage = async (message) => {
    // Scrape the reserved fields if present.
    const {
      text,
      attachments,
      id,
      parent_id,
      mentioned_users,
      html,
      __html,
      type,
      status,
      user,
      created_at,
      reactions,
      ...extraFields
    } = message;

    const messageData = {
      text,
      attachments,
      id,
      parent_id,
      mentioned_users,
      ...extraFields,
    };

    try {
      const messageResponse = await this.props.channel.sendMessage(messageData);
      // replace it after send is completed
      if (messageResponse.message) {
        messageResponse.message.status = 'received';
        this.updateMessage(messageResponse.message);
      }
    } catch (error) {
      console.log(error);
      // set the message to failed..
      message.status = 'failed';
      this.updateMessage(message);
    }
  };

  sendMessage = async ({
    text,
    attachments = [],
    parent,
    mentioned_users,
    ...extraFields
  }) => {
    // remove error messages upon submit
    this.props.channel.state.filterErrorMessages();

    // create a local preview message to show in the UI
    const messagePreview = this.createMessagePreview(
      text,
      attachments,
      parent,
      mentioned_users,
      extraFields,
    );

    // first we add the message to the UI
    this.updateMessage(messagePreview, {
      messageInput: '',
      commands: [],
      userAutocomplete: [],
    });

    await this._sendMessage(messagePreview);
  };

  retrySendMessage = async (message) => {
    // set the message status to sending
    message = message.asMutable();
    message.status = 'sending';
    this.updateMessage(message);
    // actually try to send the message...
    await this._sendMessage(message);
  };

  handleEvent = (e) => {
    const { channel } = this.props;
    let threadMessages = [];
    const threadState = {};
    if (this.state.thread) {
      threadMessages = channel.state.threads[this.state.thread.id] || [];
      threadState['threadMessages'] = threadMessages;
    }

    if (
      this.state.thread &&
      e.message &&
      e.message.id === this.state.thread.id
    ) {
      threadState['thread'] = channel.state.messageToImmutable(e.message);
    }

    if (Object.keys(threadState).length > 0) {
      // TODO: in theory we should do 1 setState call not 2,
      // However the setStateThrottled doesn't support this
      if (this._unmounted) return;
      this.setState(threadState);
    }

    if (e.type === 'member.added') {
      this.addToEventHistory(e);
    }

    if (e.type === 'member.removed') {
      this.addToEventHistory(e);
    }
    this._setStateThrottled({
      messages: channel.state.messages,
      watchers: channel.state.watchers,
      read: channel.state.read,
      typing: channel.state.typing,
      watcher_count: channel.state.watcher_count,
    });
  };

  addToEventHistory = (e) => {
    this.setState((prevState) => {
      const lastMessageId =
        prevState.messages[prevState.messages.length - 1].id;

      if (!prevState.eventHistory[lastMessageId])
        return {
          ...prevState,
          eventHistory: {
            ...prevState.eventHistory,
            [lastMessageId]: [e],
          },
        };

      return {
        ...prevState,
        eventHistory: {
          ...prevState.eventHistory,
          [lastMessageId]: [...prevState.eventHistory[lastMessageId], e],
        },
      };
    });
  };

  loadMore = async () => {
    // prevent duplicate loading events...
    if (this.state.loadingMore || !this.state.hasMore) return;
    if (this._unmounted) return;
    this.setState({ loadingMore: true });
    const oldestMessage = this.state.messages[0]
      ? this.state.messages[0]
      : null;

    if (oldestMessage.status !== 'received') {
      this.setState({
        loadingMore: false,
      });

      return;
    }

    const oldestID = oldestMessage ? oldestMessage.id : null;
    const perPage = 100;
    let queryResponse;
    try {
      queryResponse = await this.props.channel.query({
        messages: { limit: perPage, id_lt: oldestID },
      });
    } catch (e) {
      console.warn('message pagination request failed with error', e);
      if (this._unmounted) return;
      this.setState({ loadingMore: false });
      return;
    }
    const hasMore = queryResponse.messages.length === perPage;

    this._loadMoreFinishedDebounced(hasMore, this.props.channel.state.messages);
  };

  loadMoreFinished = (hasMore, messages) => {
    if (this._unmounted) return;
    this.setState({
      loadingMore: false,
      hasMore,
      messages,
    });
  };

  getContext = () => ({
    ...this.state,
    client: this.props.client,
    channel: this.props.channel,
    Message: this.props.Message,
    Attachment: this.props.Attachment,
    updateMessage: this.updateMessage,
    removeMessage: this.removeMessage,
    sendMessage: this.sendMessage,
    retrySendMessage: this.retrySendMessage,
    setEditingState: this.setEditingState,
    clearEditingState: this.clearEditingState,
    EmptyStateIndicator: this.props.EmptyStateIndicator,
    markRead: this._markReadThrottled,
    loadMore: this._loadMoreThrottled,
    // thread related
    openThread: this.openThread,
    closeThread: this.closeThread,
    loadMoreThread: this.loadMoreThread,
    emojiData: this.props.emojiData,
  });

  renderComponent = () => this.props.children;

  renderLoading = () => {
    const Indicator = this.props.LoadingIndicator;
    return <Indicator listType="message" />;
  };

  renderLoadingError = () => {
    const Indicator = this.props.LoadingErrorIndicator;
    return <Indicator listType="message" />;
  };

  render() {
    let core;

    if (this.state.error) {
      core = this.renderLoadingError();
    } else if (this.state.loading) {
      core = this.renderLoading();
    } else if (!this.props.channel || !this.props.channel.watch) {
      core = (
        <View>
          <Text>Channel Missing</Text>
        </View>
      );
    } else {
      core = (
        <KeyboardCompatibleView>
          <ChannelContext.Provider value={this.getContext()}>
            <SuggestionsProvider
              handleKeyboardAvoidingViewEnabled={(trueOrFalse) => {
                if (this._unmounted) return;
                this.setState({ kavEnabled: trueOrFalse });
              }}
            >
              {this.renderComponent()}
            </SuggestionsProvider>
          </ChannelContext.Provider>
        </KeyboardCompatibleView>
      );
    }

    return <View>{core}</View>;
  }
}
