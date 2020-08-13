import React, { useEffect, useState, useContext } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import Immutable from 'seamless-immutable';
import { logChatPromiseExecution } from 'stream-chat';
import uuidv4 from 'uuid/v4';

import { ChannelContext, ChatContext, TranslationContext } from '../../context';
import {
  LoadingIndicator as LoadingIndicatorDefault,
  LoadingErrorIndicator as LoadingErrorIndicatorDefault,
  EmptyStateIndicator as EmptyStateIndicatorDefault,
} from '../Indicators';
import { KeyboardCompatibleView as KeyboardCompatibleViewDefault } from '../KeyboardCompatibleView';

import { SuggestionsProvider } from '../SuggestionsProvider';
import { emojiData as emojiDataDefault } from '../../utils';

/**
 * This component is not really exposed externally, and is only supposed to be used with
 * 'Channel' component (which is actually exposed to customers).
 */

const Channel = (props) => {
  const {
    channel,
    children,
    disableIfFrozenChannel = true,
    disableKeyboardCompatibleView = false,
    emojiData = emojiDataDefault,
    KeyboardCompatibleView = KeyboardCompatibleViewDefault,
  } = props;

  const { client, isOnline, logger = () => {} } = useContext(ChatContext);
  const { t } = useContext(TranslationContext);

  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(false);
  const [eventHistory, setEventHistory] = useState({});
  /** We save the events in state so that we can display event message
  //      * next to the message after which it was received, in MessageList.
  //      *
  //      * e.g., eventHistory = {
  //      *   message_id_1: [
  //      *     { ...event_obj_received_after_message_id_1__1 },
  //      *     { ...event_obj_received_after_message_id_1__2 },
  //      *     { ...event_obj_received_after_message_id_1__3 },
  //      *   ],
  //      *   message_id_2: [
  //      *     { ...event_obj_received_after_message_id_2__1 },
  //      *     { ...event_obj_received_after_message_id_2__2 },
  //      *     { ...event_obj_received_after_message_id_2__3 },
  //      *   ]
  //      * }
  //      */
  const [hasMore, setHasMore] = useState(true);
  const [lastRead, setLastRead] = useState();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [members, setMembers] = useState(Immutable({}));
  const [messages, setMessages] = useState(Immutable([]));
  const [online, setOnline] = useState(isOnline);
  const [read, setRead] = useState(Immutable({}));
  const [thread, setThread] = useState(props.thread);
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);
  const [threadMessages, setThreadMessages] = useState([]);
  const [typing, setTyping] = useState(Immutable({}));
  const [unmounted, setUnmounted] = useState(false);
  const [watcherCount, setWatcherCount] = useState();
  const [watchers, setWatchers] = useState(Immutable({}));

  useEffect(() => {
    logger('Channel component', 'component mount', {
      tags: ['lifecycle', 'channel'],
      props,
    });

    if (channel) {
      initChannel();
    }

    return () => {
      logger('Channel component', 'component unmount', {
        tags: ['lifecycle', 'channel'],
        props,
      });

      channel.off(handleEvent);
      client.off('connection.recovered', handleEvent);

      handleEventThrottled.cancel();
      loadMoreFinishedDebounced.cancel();
      loadMoreThreadFinishedDebounced.cancel();
      setUnmounted(true);
    };
  }, [channel]);

  useEffect(() => {
    logger('Channel component', 'component update', {
      tags: ['lifecycle', 'channel'],
      props,
    });

    if (unmounted) return;
    setOnline(isOnline);
  }, [isOnline]);

  const loadMoreFinished = (hasMore, messages) => {
    if (unmounted) return;
    setLoadingMore(false);
    setHasMore(hasMore);
    setMessages(messages);
  };

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreFinishedDebounced = debounce(loadMoreFinished, 2000, {
    leading: true,
    trailing: true,
  });

  const loadMore = async () => {
    if (loadingMore || !hasMore || unmounted) return;
    setLoadingMore(true);

    if (!messages.length === 0) {
      return setLoadingMore(false);
    }

    const oldestMessage = messages[0] ? messages[0] : null;

    if (oldestMessage?.status !== 'received') {
      return setLoadingMore(false);
    }

    const oldestID = oldestMessage ? oldestMessage.id : null;
    const limit = 100;
    let queryResponse;
    logger('Channel Component', 'Re-querying the messages', {
      props,
      limit,
      id_lt: oldestID,
    });

    try {
      queryResponse = await channel.query({
        messages: { limit, id_lt: oldestID },
      });
    } catch (e) {
      console.warn('message pagination request failed with error', e);
      if (unmounted) return;
      return setLoadingMore(false);
    }

    const hasMore = queryResponse.messages.length === limit;
    loadMoreFinishedDebounced(hasMore, channel.state.messages);
  };

  const loadMoreThrottled = throttle(loadMore, 2000, {
    leading: true,
    trailing: true,
  });

  const loadMoreThreadFinished = (threadHasMore, threadMessages) => {
    if (unmounted) return;
    setThreadHasMore(threadHasMore);
    setThreadLoadingMore(false);
    setThreadMessages(threadMessages);
  };

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreThreadFinishedDebounced = debounce(
    loadMoreThreadFinished,
    2000,
    {
      leading: true,
      trailing: true,
    },
  );

  const markRead = () => {
    if (channel.disconnected || !channel.getConfig().read_events) {
      return;
    }

    if (props.doMarkReadRequest) {
      props.doMarkReadRequest(channel);
    } else {
      logChatPromiseExecution(channel.markRead(), 'mark read');
    }
  };

  const markReadThrottled = throttle(markRead, 500, {
    leading: true,
    trailing: true,
  });

  const copyChannelState = () => {
    if (unmounted) return;
    setLoading(false);
    setMembers(channel.state.members);
    setMessages(channel.state.messages);
    setRead(channel.state.read);
    setTyping(Immutable({}));
    setWatcherCount(channel.state.watcher_count);
    setWatchers(channel.state.watchers);

    if (channel.countUnread() > 0) {
      markRead();
    }
  };

  const addToEventHistory = (e) => {
    const lastMessageId = messages.length
      ? messages[messages.length - 1].id
      : 'none';

    setEventHistory((prevState) => {
      if (!prevState[lastMessageId]) {
        return { ...prevState, [lastMessageId]: [e] };
      } else {
        return {
          ...prevState,
          [lastMessageId]: [...prevState[lastMessageId], e],
        };
      }
    });
  };

  const handleEventStateChange = (channelState) => {
    setMessages(channelState.messages);
    setRead(channelState.read);
    setTyping(channelState.typing);
    setWatchers(channelState.watchers);
    setWatcherCount(channelState.watcher_count);
  };

  const handleEventThrottled = throttle(handleEventStateChange, 500, {
    leading: true,
    trailing: true,
  });

  const handleEvent = (e) => {
    let threadMessages = [];
    const threadState = {};

    if (thread) {
      threadMessages = channel.state.threads[thread.id] || threadMessages;
      threadState['threadMessages'] = threadMessages;
    }

    if (thread && e.message?.id === thread.id) {
      threadState['thread'] = channel.state.messageToImmutable(e.message);
    }

    if (Object.keys(threadState).length > 0) {
      if (unmounted) return;
      setThread(threadState.thread);
      setThreadMessages(threadState.threadMessages);
    }

    if (e.type === 'member.added') addToEventHistory(e);
    if (e.type === 'member.removed') addToEventHistory(e);

    handleEventThrottled(channel.state);
  };

  const listenToChanges = () => {
    // The more complex sync logic is done in chat.js
    // listen to client.connection.recovered and all channel events
    client.on('connection.recovered', handleEvent);
    channel.on(handleEvent);
  };

  const initChannel = async () => {
    let initError = false;

    if (!channel.initialized) {
      try {
        await channel.watch();
      } catch (e) {
        if (unmounted) return;
        setError(e);
        initError = true;
      }
    }

    setLastRead(new Date());
    if (!initError) {
      copyChannelState();
      listenToChanges();
    }
  };

  const openThread = (message) => {
    const threadMessages = channel.state.threads[message.id] || [];

    if (unmounted) return;
    setThread(message);
    setThreadMessages(threadMessages);
  };

  const loadMoreThread = async () => {
    if (threadLoadingMore || unmounted) return;
    setThreadLoadingMore(true);

    const parentID = thread.id;
    const oldMessages = channel.state.threads[parentID] || [];
    const oldestMessageID = oldMessages[0] ? oldMessages[0].id : null;
    const limit = 50;
    const queryResponse = await channel.getReplies(parentID, {
      id_lt: oldestMessageID,
      limit,
    });
    const hasMore = queryResponse.messages.length === limit;

    const threadMessages = channel.state.threads[parentID] || [];

    loadMoreThreadFinishedDebounced(hasMore, threadMessages);
  };

  const closeThread = () => {
    if (unmounted) return;
    setThread(null);
    setThreadMessages([]);
  };

  const setEditingState = (message) => {
    if (unmounted) return;
    setEditing(message);
  };

  const updateMessage = (updatedMessage, extraState = {}) => {
    channel.state.addMessageSorted(updatedMessage);

    if (thread && updatedMessage.parent_id) {
      extraState.threadMessages =
        channel.state.threads[updatedMessage.parent_id] || [];
    }

    if (unmounted) return;

    setMessages(channel.state.messages);
    if (extraState.threadMessages) {
      setThreadMessages(extraState.threadMessages);
    }
  };

  const clearEditingState = () => {
    if (unmounted) return;
    setEditing(false);
  };
  const removeMessage = (message) => {
    channel.state.removeMessage(message);
    if (unmounted) return;
    setMessages(channel.state.messages);
  };

  const createMessagePreview = ({
    attachments,
    extraFields,
    mentioned_users,
    parent,
    text,
  }) => {
    const clientSideID = `${client.userID}-` + uuidv4();
    const message = {
      attachments,
      created_at: new Date(),
      __html: text,
      html: text,
      id: clientSideID,
      mentioned_users,
      reactions: [],
      status: 'sending',
      text,
      type: 'regular',
      user: {
        id: client.userID,
        ...client.user,
      },
      ...extraFields,
    };

    if (parent?.id) {
      message.parent_id = parent.id;
    }
    return message;
  };

  // eslint-disable-next-line require-await
  const editMessage = async (updatedMessage) => {
    if (props.doUpdateMessageRequest) {
      return Promise.resolve(
        props.doUpdateMessageRequest(channel.cid, updatedMessage),
      );
    }

    return client.updateMessage(updatedMessage);
  };

  const sendMessageRequest = async (message) => {
    const {
      attachments,
      created_at,
      __html,
      html,
      id,
      mentioned_users,
      parent_id,
      reactions,
      status,
      text,
      type,
      user,
      ...extraFields
    } = message;

    const messageData = {
      attachments,
      id,
      mentioned_users,
      parent_id,
      text,
      ...extraFields,
    };

    try {
      let messageResponse;

      if (props.doSendMessageRequest) {
        messageResponse = await props.doSendMessageRequest(
          channel.cid,
          messageData,
        );
      } else {
        messageResponse = await channel.sendMessage(messageData);
      }

      if (messageResponse.message) {
        messageResponse.message.status = 'received';
        updateMessage(messageResponse.message);
      }
    } catch (error) {
      console.log(error);
      message.status = 'failed';
      updateMessage(message);
    }
  };

  const sendMessage = async ({
    attachments = [],
    mentioned_users,
    parent,
    text,
    ...extraFields
  }) => {
    channel.state.filterErrorMessages();

    const messagePreview = createMessagePreview({
      attachments,
      extraFields,
      mentioned_users,
      parent,
      text,
    });

    updateMessage(messagePreview, {
      commands: [],
      messageInput: '',
      userAutocomplete: [],
    });

    await sendMessageRequest(messagePreview);
  };

  const retrySendMessage = async (message) => {
    message = message.asMutable();
    message.status = 'sending';
    updateMessage(message);
    await sendMessageRequest(message);
  };

  const channelContext = {
    Attachment: props.Attachment,
    channel,
    clearEditingState,
    client,
    closeThread,
    disabled: channel.data?.frozen && disableIfFrozenChannel,
    editing,
    editMessage,
    emojiData,
    EmptyStateIndicator:
      props.EmptyStateIndicator || EmptyStateIndicatorDefault,
    error,
    eventHistory,
    hasMore,
    lastRead,
    loading,
    loadingMore,
    loadMore: loadMoreThrottled,
    loadMoreThread,
    markRead: markReadThrottled,
    members,
    Message: props.Message,
    messages,
    online,
    openThread,
    read,
    removeMessage,
    retrySendMessage,
    sendMessage,
    setEditingState,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages,
    typing,
    updateMessage,
    unmounted,
    watcherCount,
    watchers,
  };

  const renderLoading = () => {
    const { LoadingIndicator = LoadingIndicatorDefault } = props;
    return <LoadingIndicator listType='message' />;
  };

  const renderLoadingError = () => {
    const { LoadingErrorIndicator = LoadingErrorIndicatorDefault } = props;
    return <LoadingErrorIndicator error={error} listType='message' />;
  };

  if (!channel?.cid) {
    return (
      <Text style={{ fontWeight: 'bold', padding: 16 }}>
        {t('Please select a channel first')}
      </Text>
    );
  }

  if (error) {
    logger(
      'Channel component',
      'Error loading channel - rendering error indicator',
      {
        tags: ['error', 'channelComponent'],
        props,
        error,
      },
    );

    return renderLoadingError();
  } else if (loading) {
    return renderLoading();
  } else if (!channel || !channel.watch) {
    return (
      <View style={{ height: '100%' }}>
        <Text>{t('Channel Missing')}</Text>
      </View>
    );
  } else {
    return (
      <KeyboardCompatibleView enabled={!disableKeyboardCompatibleView}>
        <ChannelContext.Provider value={channelContext}>
          <SuggestionsProvider>{children}</SuggestionsProvider>
        </ChannelContext.Provider>
      </KeyboardCompatibleView>
    );
  }
};

Channel.propTypes = {
  /** Which channel to connect to */
  channel: PropTypes.shape({
    watch: PropTypes.func,
  }).isRequired,
  /** The loading indicator to use */
  LoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** The indicator to use when there is error  */
  LoadingErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** The indicator to use when message list is empty */
  EmptyStateIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Message UI component to display a message in message list.
   *
   * Available built-in component (also accepts the same props as): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   *
   * */
  Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Attachment UI component to display attachment in individual message.
   *
   * Available built-in component (also accepts the same props as): [Attachment](https://getstream.github.io/stream-chat-react-native/#attachment)
   * */
  Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Override mark channel read request (Advanced usage only)
   *
   * @param channel Channel object
   * */
  doMarkReadRequest: PropTypes.func,
  /**
   * Override send message request (Advanced usage only)
   *
   * @param channelId
   * @param messageData Message object
   * */
  doSendMessageRequest: PropTypes.func,
  /**
   * Override update message request (Advanced usage only)
   * @param channelId
   * @param updatedMessage UpdatedMessage object
   * */
  doUpdateMessageRequest: PropTypes.func,
  /** Disables the channel UI if channel is frozen */
  disableIfFrozenChannel: PropTypes.bool,
  /**
   * If true, KeyboardCompatibleView wrapper is disabled.
   *
   * Channel component internally uses [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js) component
   * internally to adjust the height of Channel component when keyboard is opened or dismissed. This prop gives you ability to disable this functionality, in case if you
   * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or you want to handle keyboard dismissal yourself.
   * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
   * */
  disableKeyboardCompatibleView: PropTypes.bool,
  /**
   * Custom wrapper component that handles height adjustment of Channel component when keyboard is opened or dismissed.
   * Defaults to [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js)
   *
   * This prop can be used to configure default KeyboardCompatibleView component.
   * e.g.,
   * <Channel
   *  channel={channel}
   *  ...
   *  KeyboardCompatibleView={(props) => {
   *    return (
   *      <KeyboardCompatibleView keyboardDismissAnimationDuration={200} keyboardOpenAnimationDuration={200}>
   *        {props.children}
   *      </KeyboardCompatibleView>
   *    )
   *  }}
   * />
   */
  KeyboardCompatibleView: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
};

export default Channel;

// class ChannelInner extends React.PureComponent {
//   constructor(props) {
//     super(props);
//     this.state = this.getInitialStateFromProps(props);
//     // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
//     this._loadMoreFinishedDebounced = debounce(this.loadMoreFinished, 2000, {
//       leading: true,
//       trailing: true,
//     });

//     this._loadMoreThrottled = throttle(this.loadMore, 2000, {
//       leading: true,
//       trailing: true,
//     });

//     // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
//     this._loadMoreThreadFinishedDebounced = debounce(
//       this.loadMoreThreadFinished,
//       2000,
//       {
//         leading: true,
//         trailing: true,
//       },
//     );

//     this._setStateThrottled = throttle(this.setState, 500, {
//       leading: true,
//       trailing: true,
//     });

//     this._markReadThrottled = throttle(this.markRead, 500, {
//       leading: true,
//       trailing: true,
//     });

//     this.messageInputBox = false;

//     this.props.logger('Channel component', 'Constructor', {
//       props: this.props,
//       state: this.state,
//     });
//   }

//   static propTypes = {
//     /** Which channel to connect to */
//     channel: PropTypes.shape({
//       watch: PropTypes.func,
//     }).isRequired,
//     /** Client is passed via the Chat Context */
//     client: PropTypes.object.isRequired,
//     /** The loading indicator to use */
//     LoadingIndicator: PropTypes.oneOfType([
//       PropTypes.node,
//       PropTypes.elementType,
//     ]),
//     /** The indicator to use when there is error  */
//     LoadingErrorIndicator: PropTypes.oneOfType([
//       PropTypes.node,
//       PropTypes.elementType,
//     ]),
//     /** The indicator to use when message list is empty */
//     EmptyStateIndicator: PropTypes.oneOfType([
//       PropTypes.node,
//       PropTypes.elementType,
//     ]),
//     isOnline: PropTypes.bool,
//     Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
//     Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
//     /**
//      * Override mark channel read request (Advanced usage only)
//      *
//      * @param channel Channel object
//      * */
//     doMarkReadRequest: PropTypes.func,
//     /**
//      * Override send message request (Advanced usage only)
//      *
//      * @param channelId
//      * @param messageData Message object
//      * */
//     doSendMessageRequest: PropTypes.func,
//     /**
//      * Override update message request (Advanced usage only)
//      * @param channelId
//      * @param updatedMessage UpdatedMessage object
//      * */
//     doUpdateMessageRequest: PropTypes.func,
//     /** Disables the channel UI if channel is frozen */
//     disableIfFrozenChannel: PropTypes.bool,
//   };

//   static defaultProps = {
//     LoadingIndicator,
//     LoadingErrorIndicator,
//     EmptyStateIndicator,
//     emojiData,
//     logger: () => {},
//   };

//   async componentDidUpdate(prevProps) {
//     this.props.logger('Channel component', 'componentDidUpdate', {
//       tags: ['lifecycle', 'channel'],
//       props: this.props,
//       state: this.state,
//     });

//     if (this.props.isOnline !== prevProps.isOnline) {
//       if (this._unmounted) return;
//       this.setState({ online: this.props.isOnline });
//     }

//     if (this.props.channel.id !== prevProps.channel.id) {
//       const resetState = this.getInitialStateFromProps(this.props);
//       this.setState(resetState);
//       await this.initChannel();
//     }
//   }

//   getInitialStateFromProps(props) {
//     return {
//       error: false,
//       // Loading the initial content of the channel
//       loading: true,
//       // Loading more messages
//       loadingMore: false,
//       hasMore: true,
//       messages: Immutable([]),
//       online: props.isOnline,
//       typing: Immutable({}),
//       watchers: Immutable({}),
//       members: Immutable({}),
//       read: Immutable({}),
//       thread: props.thread,
//       threadMessages: [],
//       threadLoadingMore: false,
//       threadHasMore: true,
//       /** We save the events in state so that we can display event message
//        * next to the message after which it was received, in MessageList.
//        *
//        * e.g., eventHistory = {
//        *   message_id_1: [
//        *     { ...event_obj_received_after_message_id_1__1 },
//        *     { ...event_obj_received_after_message_id_1__2 },
//        *     { ...event_obj_received_after_message_id_1__3 },
//        *   ],
//        *   message_id_2: [
//        *     { ...event_obj_received_after_message_id_2__1 },
//        *     { ...event_obj_received_after_message_id_2__2 },
//        *     { ...event_obj_received_after_message_id_2__3 },
//        *   ]
//        * }
//        */
//       eventHistory: {},
//     };
//   }

//   async initChannel() {
//     const channel = this.props.channel;
//     let errored = false;
//     if (!channel.initialized) {
//       try {
//         await channel.watch();
//       } catch (e) {
//         if (this._unmounted) return;
//         this.setState({ error: e });
//         errored = true;
//       }
//     }

//     this.lastRead = new Date();
//     if (!errored) {
//       this.copyChannelState();
//       this.listenToChanges();
//     }
//   }

//   async componentDidMount() {
//     this.props.logger('Channel component', 'componentDidMount', {
//       tags: ['lifecycle', 'channel'],
//       props: this.props,
//       state: this.state,
//     });
//     await this.initChannel();
//   }

//   componentWillUnmount() {
//     this.props.logger('Channel component', 'componentWillUnmount', {
//       tags: ['lifecycle', 'channel'],
//       props: this.props,
//       state: this.state,
//     });

//     this.props.channel.off(this.handleEvent);
//     this.props.client.off('connection.recovered', this.handleEvent);

//     this._loadMoreFinishedDebounced.cancel();
//     this._loadMoreThreadFinishedDebounced.cancel();
//     this._setStateThrottled.cancel();
//     this._unmounted = true;
//   }

//   copyChannelState() {
//     const channel = this.props.channel;

//     if (this._unmounted) return;
//     this.setState({
//       messages: channel.state.messages,
//       read: channel.state.read,
//       watchers: channel.state.watchers,
//       members: channel.state.members,
//       watcher_count: channel.state.watcher_count,
//       loading: false,
//       typing: Immutable({}),
//     });

//     if (channel.countUnread() > 0) this.markRead();
//   }

//   markRead = () => {
//     if (
//       this.props.channel.disconnected ||
//       !this.props.channel.getConfig().read_events
//     ) {
//       return;
//     }

//     const { doMarkReadRequest, channel } = this.props;

//     if (doMarkReadRequest) {
//       doMarkReadRequest(channel);
//     } else {
//       logChatPromiseExecution(channel.markRead(), 'mark read');
//     }
//   };

//   listenToChanges() {
//     // The more complex sync logic is done in chat.js
//     // listen to client.connection.recovered and all channel events
//     this.props.client.on('connection.recovered', this.handleEvent);
//     const channel = this.props.channel;
//     channel.on(this.handleEvent);
//   }

//   openThread = (message) => {
//     const channel = this.props.channel;
//     const threadMessages = channel.state.threads[message.id] || [];

//     if (this._unmounted) return;
//     this.setState({
//       thread: message,
//       threadMessages,
//     });
//   };

//   loadMoreThread = async () => {
//     // prevent duplicate loading events...
//     if (this.state.threadLoadingMore) return;
//     if (this._unmounted) return;
//     this.setState({
//       threadLoadingMore: true,
//     });
//     const channel = this.props.channel;
//     const parentID = this.state.thread.id;
//     const oldMessages = channel.state.threads[parentID] || [];
//     const oldestMessageID = oldMessages[0] ? oldMessages[0].id : null;
//     const limit = 50;
//     const queryResponse = await channel.getReplies(parentID, {
//       limit,
//       id_lt: oldestMessageID,
//     });
//     const hasMore = queryResponse.messages.length === limit;

//     const threadMessages = channel.state.threads[parentID] || [];

//     // next set loadingMore to false so we can start asking for more data...
//     this._loadMoreThreadFinishedDebounced(hasMore, threadMessages);
//   };

//   loadMoreThreadFinished = (threadHasMore, threadMessages) => {
//     if (this._unmounted) return;
//     this.setState({
//       threadLoadingMore: false,
//       threadHasMore,
//       threadMessages,
//     });
//   };

//   closeThread = () => {
//     if (this._unmounted) return;
//     this.setState({
//       thread: null,
//       threadMessages: [],
//     });
//   };

//   setEditingState = (message) => {
//     if (this._unmounted) return;
//     this.setState({
//       editing: message,
//     });
//   };

//   updateMessage = (updatedMessage, extraState) => {
//     const channel = this.props.channel;

//     extraState = extraState || {};

//     // adds the message to the local channel state..
//     // this adds to both the main channel state as well as any reply threads
//     channel.state.addMessageSorted(updatedMessage);

//     // update the Channel component state
//     if (this.state.thread && updatedMessage.parent_id) {
//       extraState.threadMessages =
//         channel.state.threads[updatedMessage.parent_id] || [];
//     }
//     if (this._unmounted) return;
//     this.setState({ messages: channel.state.messages, ...extraState });
//   };

//   clearEditingState = () => {
//     if (this._unmounted) return;
//     this.setState({
//       editing: false,
//     });
//   };
//   removeMessage = (message) => {
//     const channel = this.props.channel;
//     channel.state.removeMessage(message);
//     if (this._unmounted) return;
//     this.setState({ messages: channel.state.messages });
//   };

//   removeEphemeralMessages() {
//     const c = this.props.channel;
//     c.state.selectRegularMessages();
//     if (this._unmounted) return;
//     this.setState({ messages: c.state.messages });
//   }

//   createMessagePreview = (
//     text,
//     attachments,
//     parent,
//     mentioned_users,
//     extraFields,
//   ) => {
//     // create a preview of the message
//     const clientSideID = `${this.props.client.userID}-` + uuidv4();
//     const message = {
//       text,
//       html: text,
//       __html: text,
//       //id: tmpID,
//       id: clientSideID,
//       type: 'regular',
//       status: 'sending',
//       user: {
//         id: this.props.client.userID,
//         ...this.props.client.user,
//       },
//       created_at: new Date(),
//       attachments,
//       mentioned_users,
//       reactions: [],
//       ...extraFields,
//     };

//     if (parent && parent.id) {
//       message.parent_id = parent.id;
//     }
//     return message;
//   };

//   // eslint-disable-next-line require-await
//   editMessage = async (updatedMessage) => {
//     if (this.props.doUpdateMessageRequest) {
//       return Promise.resolve(
//         this.props.doUpdateMessageRequest(
//           this.props.channel.cid,
//           updatedMessage,
//         ),
//       );
//     }

//     return this.props.client.updateMessage(updatedMessage);
//   };

//   _sendMessage = async (message) => {
//     // Scrape the reserved fields if present.
//     const {
//       text,
//       attachments,
//       id,
//       parent_id,
//       mentioned_users,
//       html,
//       __html,
//       type,
//       status,
//       user,
//       created_at,
//       reactions,
//       ...extraFields
//     } = message;

//     const messageData = {
//       text,
//       attachments,
//       id,
//       parent_id,
//       mentioned_users,
//       ...extraFields,
//     };

//     try {
//       let messageResponse;
//       if (this.props.doSendMessageRequest) {
//         messageResponse = await this.props.doSendMessageRequest(
//           this.props.channel.cid,
//           messageData,
//         );
//       } else {
//         messageResponse = await this.props.channel.sendMessage(messageData);
//       }

//       // replace it after send is completed
//       if (messageResponse.message) {
//         messageResponse.message.status = 'received';
//         this.updateMessage(messageResponse.message);
//       }
//     } catch (error) {
//       console.log(error);
//       // set the message to failed..
//       message.status = 'failed';
//       this.updateMessage(message);
//     }
//   };

//   sendMessage = async ({
//     attachments = [],
//     mentioned_users,
//     parent,
//     text,
//     ...extraFields
//   }) => {
//     // remove error messages upon submit
//     this.props.channel.state.filterErrorMessages();

//     // create a local preview message to show in the UI
//     const messagePreview = this.createMessagePreview(
//       text,
//       attachments,
//       parent,
//       mentioned_users,
//       extraFields,
//     );

//     // first we add the message to the UI
//     this.updateMessage(messagePreview, {
//       messageInput: '',
//       commands: [],
//       userAutocomplete: [],
//     });

//     await this._sendMessage(messagePreview);
//   };

//   retrySendMessage = async (message) => {
//     // set the message status to sending
//     message = message.asMutable();
//     message.status = 'sending';
//     this.updateMessage(message);
//     // actually try to send the message...
//     await this._sendMessage(message);
//   };

//   handleEvent = (e) => {
//     const { channel } = this.props;
//     let threadMessages = [];
//     const threadState = {};
//     if (this.state.thread) {
//       threadMessages =
//         channel.state.threads[this.state.thread.id] ||
//         this.state.threadMessages;
//       threadState['threadMessages'] = threadMessages;
//     }

//     if (
//       this.state.thread &&
//       e.message &&
//       e.message.id === this.state.thread.id
//     ) {
//       threadState['thread'] = channel.state.messageToImmutable(e.message);
//     }

//     if (Object.keys(threadState).length > 0) {
//       // TODO: in theory we should do 1 setState call not 2,
//       // However the setStateThrottled doesn't support this
//       if (this._unmounted) return;
//       this.setState(threadState);
//     }

//     if (e.type === 'member.added') {
//       this.addToEventHistory(e);
//     }

//     if (e.type === 'member.removed') {
//       this.addToEventHistory(e);
//     }
//     this._setStateThrottled({
//       messages: channel.state.messages,
//       watchers: channel.state.watchers,
//       read: channel.state.read,
//       typing: channel.state.typing,
//       watcher_count: channel.state.watcher_count,
//     });
//   };

//   addToEventHistory = (e) => {
//     this.setState((prevState) => {
//       const lastMessageId =
//         prevState.messages.length > 0
//           ? prevState.messages[prevState.messages.length - 1].id
//           : 'none';

//       if (!prevState.eventHistory[lastMessageId])
//         return {
//           ...prevState,
//           eventHistory: {
//             ...prevState.eventHistory,
//             [lastMessageId]: [e],
//           },
//         };

//       return {
//         ...prevState,
//         eventHistory: {
//           ...prevState.eventHistory,
//           [lastMessageId]: [...prevState.eventHistory[lastMessageId], e],
//         },
//       };
//     });
//   };

//   loadMore = async () => {
//     // prevent duplicate loading events...
//     if (this.state.loadingMore || !this.state.hasMore) return;
//     if (this._unmounted) return;
//     this.setState({ loadingMore: true });

//     if (!this.state.messages.length === 0) {
//       this.setState({
//         loadingMore: false,
//       });

//       return;
//     }

//     const oldestMessage = this.state.messages[0]
//       ? this.state.messages[0]
//       : null;

//     if (oldestMessage && oldestMessage.status !== 'received') {
//       this.setState({
//         loadingMore: false,
//       });

//       return;
//     }

//     const oldestID = oldestMessage ? oldestMessage.id : null;
//     const perPage = 100;
//     let queryResponse;
//     this.props.logger('Channel Component', 'Requerying the messages', {
//       props: this.props,
//       state: this.state,
//       limit: perPage,
//       id_lt: oldestID,
//     });
//     try {
//       queryResponse = await this.props.channel.query({
//         messages: { limit: perPage, id_lt: oldestID },
//       });
//     } catch (e) {
//       console.warn('message pagination request failed with error', e);
//       if (this._unmounted) return;
//       this.setState({ loadingMore: false });
//       return;
//     }
//     const hasMore = queryResponse.messages.length === perPage;

//     this._loadMoreFinishedDebounced(hasMore, this.props.channel.state.messages);
//   };

//   loadMoreFinished = (hasMore, messages) => {
//     if (this._unmounted) return;
//     this.setState({
//       loadingMore: false,
//       hasMore,
//       messages,
//     });
//   };

//   getContext = () => ({
//     ...this.state,
//     client: this.props.client,
//     channel: this.props.channel,
//     Message: this.props.Message,
//     Attachment: this.props.Attachment,
//     updateMessage: this.updateMessage,
//     removeMessage: this.removeMessage,
//     sendMessage: this.sendMessage,
//     editMessage: this.editMessage,
//     retrySendMessage: this.retrySendMessage,
//     setEditingState: this.setEditingState,
//     clearEditingState: this.clearEditingState,
//     EmptyStateIndicator: this.props.EmptyStateIndicator,
//     markRead: this._markReadThrottled,
//     loadMore: this._loadMoreThrottled,
//     // thread related
//     openThread: this.openThread,
//     closeThread: this.closeThread,
//     loadMoreThread: this.loadMoreThread,
//     emojiData: this.props.emojiData,
//     disabled:
//       this.props.channel.data &&
//       this.props.channel.data.frozen &&
//       this.props.disableIfFrozenChannel,
//   });

//   renderLoading = () => {
//     const Indicator = this.props.LoadingIndicator;
//     return <Indicator listType='message' />;
//   };

//   renderLoadingError = () => {
//     const Indicator = this.props.LoadingErrorIndicator;
//     return <Indicator error={this.state.error} listType='message' />;
//   };

//   render() {
//     let core;
//     const { children, KeyboardCompatibleView, t } = this.props;
//     if (this.state.error) {
//       this.props.logger(
//         'Channel component',
//         'Error loading channel - rendering error indicator',
//         {
//           tags: ['error', 'channelComponent'],
//           props: this.props,
//           state: this.state,
//           error: this.state.error,
//         },
//       );

//       core = this.renderLoadingError();
//     } else if (this.state.loading) {
//       core = this.renderLoading();
//     } else if (!this.props.channel || !this.props.channel.watch) {
//       core = (
//         <View>
//           <Text>{t('Channel Missing')}</Text>
//         </View>
//       );
//     } else {
//       core = (
//         <KeyboardCompatibleView
//           enabled={!this.props.disableKeyboardCompatibleView}
//         >
//           <ChannelContext.Provider value={this.getContext()}>
//             <SuggestionsProvider>{children}</SuggestionsProvider>
//           </ChannelContext.Provider>
//         </KeyboardCompatibleView>
//       );
//     }

//     return <View style={{ height: '100%' }}>{core}</View>;
//   }
// }

// export default ChannelInner;
