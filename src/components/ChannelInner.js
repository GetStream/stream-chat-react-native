import React, { PureComponent } from 'react';
import {
  View,
  Text,
  Keyboard,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { ChannelContext } from '../context';
import { SuggestionsProvider } from './SuggestionsProvider';

import uuidv4 from 'uuid/v4';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

import { LoadingIndicator } from './LoadingIndicator';
import { LoadingErrorIndicator } from './LoadingErrorIndicator';
import { EmptyStateIndicator } from './EmptyStateIndicator';

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
      channelHeight: new Animated.Value('100%'),
    };

    // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
    this._loadMoreFinishedDebounced = debounce(this.loadMoreFinished, 2000, {
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

    this.rootChannelView = false;
    this.initialHeight = undefined;
    this.messageInputBox = false;

    if (Platform.OS === 'ios') {
      this.keyboardDidShowListener = Keyboard.addListener(
        'keyboardWillShow',
        this.keyboardDidShow,
      );
    } else {
      // Android doesn't support keyboardWillShow event.
      this.keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        this.keyboardDidShow,
      );
    }

    // We dismiss the keyboard manually (along with keyboardWillHide function) when message is touched.
    // Following listener is just for a case when keyboard gets dismissed due to something besides message touch.
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardDidHide,
    );

    this._keyboardOpen = false;
    // Following variable takes care of race condition between keyboardDidHide and keyboardDidShow.
    this._hidingKeyboardInProgress = false;
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
  };

  static defaultProps = {
    LoadingIndicator,
    LoadingErrorIndicator,
    EmptyStateIndicator,
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

    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  // TODO: Better to extract following functions to different HOC.
  keyboardDidShow = (e) => {
    const keyboardHidingInProgressBeforeMeasure = this
      ._hidingKeyboardInProgress;
    const keyboardHeight = e.endCoordinates.height;

    this.rootChannelView.measureInWindow((x, y) => {
      // In case if keyboard was closed in meanwhile while
      // this measure function was being executed, then we
      // should abort further execution and let the event callback
      // keyboardDidHide proceed.
      if (
        !keyboardHidingInProgressBeforeMeasure &&
        this._hidingKeyboardInProgress
      ) {
        console.log(
          'Aborting keyboardDidShow operation since hide is in progress!',
        );
        return;
      }

      const { height: windowHeight } = Dimensions.get('window');

      Animated.timing(this.state.channelHeight, {
        toValue: windowHeight - y - keyboardHeight,
        duration: 500,
      }).start(() => {
        // Force the final value, in case animation halted in between.
        this.state.channelHeight.setValue(windowHeight - y - keyboardHeight);
      });
    });
    this._keyboardOpen = true;
  };

  keyboardDidHide = () => {
    this._hidingKeyboardInProgress = true;
    Animated.timing(this.state.channelHeight, {
      toValue: this.initialHeight,
      duration: 500,
    }).start(() => {
      // Force the final value, in case animation halted in between.
      this.state.channelHeight.setValue(this.initialHeight);
      this._hidingKeyboardInProgress = false;
      this._keyboardOpen = false;
    });
  };

  keyboardWillDismiss = () =>
    new Promise((resolve) => {
      if (!this._keyboardOpen) {
        resolve();
        return;
      }

      Animated.timing(this.state.channelHeight, {
        toValue: this.initialHeight,
        duration: 500,
      }).start((response) => {
        this.state.channelHeight.setValue(this.initialHeight);
        if (response && !response.finished) {
          // If by some chance animation didn't go smooth or had some issue,
          // then simply defer promise resolution until after 500 ms.
          // This is the time we perform animation for adjusting animation of Channel component height
          // during keyboard dismissal.
          setTimeout(() => {
            resolve();
          }, 500);
          return;
        }

        resolve();
      });
    });

  dismissKeyboard = async () => {
    Keyboard.dismiss();
    await this.keyboardWillDismiss();
  };

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
      typing: {},
    });

    this.markRead();
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

  openThread = (message, e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

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

  closeThread = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

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

  createMessagePreview = (text, attachments, parent, mentioned_users) => {
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
    };

    if (parent && parent.id) {
      message.parent_id = parent.id;
    }
    return message;
  };

  _sendMessage = async (message) => {
    const { text, attachments, id, parent_id, mentioned_users } = message;
    const messageData = {
      text,
      attachments,
      id,
      parent_id,
      mentioned_users,
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

  sendMessage = async ({ text, attachments = [], parent, mentioned_users }) => {
    // remove error messages upon submit
    this.props.channel.state.filterErrorMessages();

    // create a local preview message to show in the UI
    const messagePreview = this.createMessagePreview(
      text,
      attachments,
      parent,
      mentioned_users,
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

    this._setStateThrottled({
      messages: channel.state.messages,
      watchers: channel.state.watchers,
      read: channel.state.read,
      typing: channel.state.typing,
      watcher_count: channel.state.watcher_count,
    });
  };

  loadMore = async () => {
    // prevent duplicate loading events...
    if (this.state.loadingMore) return;
    if (this._unmounted) return;
    this.setState({ loadingMore: true });

    const oldestID = this.state.messages[0] ? this.state.messages[0].id : null;
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
    channels: this.props.channels,
    client: this.props.client,
    channel: this.props.channel,
    Message: this.props.Message,
    Attachment: this.props.Attachment,
    updateMessage: this.updateMessage,
    removeMessage: this.removeMessage,
    sendMessage: this.sendMessage,
    retrySendMessage: this.retrySendMessage,
    resetNotification: this.resetNotification,
    listenToScroll: this.listenToScroll,
    setEditingState: this.setEditingState,
    clearEditingState: this.clearEditingState,
    EmptyStateIndicator: this.props.EmptyStateIndicator,
    dismissKeyboard: this.dismissKeyboard,
    markRead: this._markReadThrottled,

    loadMore: this.loadMore,
    // thread related
    openThread: this.openThread,
    closeThread: this.closeThread,
    loadMoreThread: this.loadMoreThread,
    openSuggestions: this.openSuggestions,
    closeSuggestions: this.closeSuggestions,
    updateSuggestions: this.updateSuggestions,
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

  setRootChannelView = (o) => {
    this.rootChannelView = o;
  };

  onLayout = ({
    nativeEvent: {
      layout: { height },
    },
  }) => {
    // Not to set initial height again.
    if (!this.initialHeight) {
      this.initialHeight = height;
      this.state.channelHeight.setValue(this.initialHeight);
    }
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
      const height = this.initialHeight
        ? { height: this.state.channelHeight }
        : {};
      core = (
        <Animated.View
          style={{ display: 'flex', ...height }}
          onLayout={this.onLayout}
        >
          <View ref={this.setRootChannelView} collapsable={false}>
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
          </View>
        </Animated.View>
      );
    }

    return <View>{core}</View>;
  }
}
