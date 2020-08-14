import React, { useEffect, useState, useContext } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import Immutable from 'seamless-immutable';
import { logChatPromiseExecution } from 'stream-chat';
import uuidv4 from 'uuid/v4';

import {
  ChannelContext,
  ChatContext,
  MessagesContext,
  ThreadContext,
  TranslationContext,
} from '../../context';
import {
  LoadingIndicator as LoadingIndicatorDefault,
  LoadingErrorIndicator as LoadingErrorIndicatorDefault,
  EmptyStateIndicator as EmptyStateIndicatorDefault,
} from '../Indicators';
import { KeyboardCompatibleView as KeyboardCompatibleViewDefault } from '../KeyboardCompatibleView';
import { SuggestionsProvider } from '../SuggestionsProvider';
import { emojiData as emojiDataDefault } from '../../utils';

/**
 *
 * Channel - Wrapper component for a channel. It needs to be place inside of the Chat component.
 * MessageList, Thread, and MessageInput should be used as children of the Channel component.
 *
 * @example ../docs/Channel.md
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
  /**
   * We save the events in state so that we can display event message
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
  const [threadMessages, setThreadMessages] = useState(
    channel.state.threads?.[props.thread?.id] || [],
  );
  const [typing, setTyping] = useState(Immutable({}));
  const [unmounted, setUnmounted] = useState(false);
  const [watcherCount, setWatcherCount] = useState();
  const [watchers, setWatchers] = useState(Immutable({}));

  useEffect(() => {
    logger('Channel component', 'component mount', {
      tags: ['lifecycle', 'channel'],
      props,
    });

    if (channel) initChannel();

    return () => {
      logger('Channel component', 'component unmount', {
        tags: ['lifecycle', 'channel'],
        props,
      });

      client.off('connection.recovered', handleEvent);
      channel.off(handleEvent);
      handleEventStateThrottled.cancel();
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

    if (unmounted || online === isOnline) return;
    setOnline(isOnline);
  }, [isOnline]);

  /**
   * CHANNEL METHODS
   */

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
      markReadThrottled();
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
    setWatcherCount(channelState.watcher_count);
    setWatchers(channelState.watchers);
  };

  const handleEventStateThrottled = throttle(handleEventStateChange, 500, {
    leading: true,
    trailing: true,
  });

  const handleEvent = (e) => {
    if (unmounted) return;

    if (thread) {
      const updatedThreadMessages =
        channel.state.threads[thread.id] || threadMessages;
      setThreadMessages(updatedThreadMessages);
    }

    if (thread && e.message?.id === thread.id) {
      const updatedThread = channel.state.messageToImmutable(e.message);
      setThread(updatedThread);
    }

    if (e.type === 'member.added') addToEventHistory(e);
    if (e.type === 'member.removed') addToEventHistory(e);

    handleEventStateThrottled(channel.state);
  };

  const listenToChanges = () => {
    // The more complex sync logic is done in Chat.js
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

  /**
   * MESSAGE METHODS
   */

  const updateMessage = (updatedMessage, extraState = {}) => {
    channel.state.addMessageSorted(updatedMessage);

    if (thread && updatedMessage.parent_id) {
      extraState.threadMessages =
        channel.state.threads[updatedMessage.parent_id] || [];
      setThreadMessages(extraState.threadMessages);
    }

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
    const message = {
      attachments,
      created_at: new Date(),
      __html: text,
      html: text,
      id: `${client.userID}-${uuidv4()}`,
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

  const loadMoreFinished = (updatedHasMore, messages) => {
    if (unmounted) return;
    setLoadingMore(false);
    setHasMore(updatedHasMore);
    setMessages(messages);
  };

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreFinishedDebounced = debounce(loadMoreFinished, 2000, {
    leading: true,
    trailing: true,
  });

  const loadMore = async () => {
    if (loadingMore || hasMore === false || unmounted) return;
    setLoadingMore(true);

    if (!messages.length) {
      return setLoadingMore(false);
    }

    const oldestMessage = messages[0] ? messages[0] : null;

    if (oldestMessage?.status !== 'received') {
      return setLoadingMore(false);
    }

    const oldestID = oldestMessage ? oldestMessage.id : null;
    const limit = 100;

    try {
      logger('Channel Component', 'Re-querying the messages', {
        props,
        limit,
        id_lt: oldestID,
      });

      const queryResponse = await channel.query({
        messages: { limit, id_lt: oldestID },
      });

      const updatedHasMore = queryResponse.messages.length === limit;
      loadMoreFinishedDebounced(updatedHasMore, channel.state.messages);
    } catch (e) {
      console.warn('Message pagination request failed with error', e);
      if (unmounted) return;
      return setLoadingMore(false);
    }
  };

  const loadMoreThrottled = throttle(loadMore, 2000, {
    leading: true,
    trailing: true,
  });

  // eslint-disable-next-line require-await
  const editMessage = async (updatedMessage) => {
    if (props.doUpdateMessageRequest) {
      return Promise.resolve(
        props.doUpdateMessageRequest(channel.cid, updatedMessage),
      );
    }
    return client.updateMessage(updatedMessage);
  };

  const setEditingState = (message) => {
    if (unmounted) return;
    setEditing(message);
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

  /**
   * THREAD METHODS
   */

  const openThread = (message) => {
    const threadMessages = channel.state.threads[message.id] || [];
    if (unmounted) return;
    setThread(message);
    setThreadMessages(threadMessages);
  };

  const closeThread = () => {
    if (unmounted) return;
    setThread(null);
    setThreadMessages([]);
  };

  const loadMoreThreadFinished = (threadHasMore, updatedThreadMessages) => {
    if (unmounted) return;
    setThreadHasMore(threadHasMore);
    setThreadLoadingMore(false);
    setThreadMessages(updatedThreadMessages);
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

    const updatedHasMore = queryResponse.messages.length === limit;
    const updatedThreadMessages = channel.state.threads[parentID] || [];
    loadMoreThreadFinishedDebounced(updatedHasMore, updatedThreadMessages);
  };

  const channelContext = {
    channel,
    client,
    disabled: channel.data?.frozen && disableIfFrozenChannel,
    EmptyStateIndicator:
      props.EmptyStateIndicator || EmptyStateIndicatorDefault,
    error,
    eventHistory,
    hasMore,
    lastRead,
    loading,
    loadingMore,
    markRead: markReadThrottled,
    members,
    online,
    read,
    typing,
    unmounted,
    watcherCount,
    watchers,
  };

  const messagesContext = {
    Attachment: props.Attachment,
    clearEditingState,
    editing,
    editMessage,
    emojiData,
    loadMore: loadMoreThrottled,
    Message: props.Message,
    messages,
    removeMessage,
    retrySendMessage,
    sendMessage,
    setEditingState,
    updateMessage,
  };

  const threadContext = {
    closeThread,
    openThread,
    loadMoreThread,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages,
  };

  if (!channel?.cid || !channel.watch) {
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

    const { LoadingErrorIndicator = LoadingErrorIndicatorDefault } = props;
    return <LoadingErrorIndicator error={error} listType='message' />;
  }

  if (loading) {
    const { LoadingIndicator = LoadingIndicatorDefault } = props;
    return <LoadingIndicator listType='message' />;
  }

  return (
    <KeyboardCompatibleView enabled={!disableKeyboardCompatibleView}>
      <ChannelContext.Provider value={channelContext}>
        <MessagesContext.Provider value={messagesContext}>
          <ThreadContext.Provider value={threadContext}>
            <SuggestionsProvider>{children}</SuggestionsProvider>
          </ThreadContext.Provider>
        </MessagesContext.Provider>
      </ChannelContext.Provider>
    </KeyboardCompatibleView>
  );
};

Channel.propTypes = {
  /** Which channel to connect to */
  channel: PropTypes.shape({
    watch: PropTypes.func,
  }).isRequired,
  /**
   * Attachment UI component to display attachment in individual message.
   * Available built-in component (also accepts the same props as): [Attachment](https://getstream.github.io/stream-chat-react-native/#attachment)
   * */
  Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
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
   * Override mark channel read request (Advanced usage only)
   * @param channel Channel object
   * */
  doMarkReadRequest: PropTypes.func,
  /**
   * Override send message request (Advanced usage only)
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
  /** The indicator to use when message list is empty */
  EmptyStateIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
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
  /** The indicator to use when there is error  */
  LoadingErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** The loading indicator to use */
  LoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Message UI component to display a message in message list.
   * Available built-in component (also accepts the same props as): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   * */
  Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default Channel;
