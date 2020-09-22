import React, { useContext, useEffect, useState } from 'react';
import { Text } from 'react-native';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import { logChatPromiseExecution } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

import EmptyStateIndicatorDefault from '../Indicators/EmptyStateIndicator';
import LoadingErrorIndicatorDefault from '../Indicators/LoadingErrorIndicator';
import LoadingIndicatorDefault from '../Indicators/LoadingIndicator';
import KeyboardCompatibleViewDefault from '../KeyboardCompatibleView/KeyboardCompatibleView';
import SuggestionsProvider from '../SuggestionsProvider/SuggestionsProvider';

import {
  ChannelContext,
  ChatContext,
  MessagesContext,
  ThreadContext,
  TranslationContext,
} from '../../context';
import { emojiData as emojiDataDefault } from '../../utils/utils';

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList, Thread, and MessageInput must be
 * children of the Channel component to receive the ChannelContext.
 *
 * @example ../docs/Channel.md
 */
const Channel = (props) => {
  const {
    channel,
    children,
    disableIfFrozenChannel = true,
    emojiData = emojiDataDefault,
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    KeyboardCompatibleView = KeyboardCompatibleViewDefault,
    LoadingErrorIndicator = LoadingErrorIndicatorDefault,
    LoadingIndicator = LoadingIndicatorDefault,
  } = props;

  const { client } = useContext(ChatContext);
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
  const [read, setRead] = useState(Immutable({}));
  const [thread, setThread] = useState(props.thread);
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);
  const [threadMessages, setThreadMessages] = useState(
    channel?.state?.threads?.[props.thread?.id] || [],
  );
  const [typing, setTyping] = useState(Immutable({}));
  const [watcherCount, setWatcherCount] = useState();
  const [watchers, setWatchers] = useState(Immutable({}));

  useEffect(() => {
    if (channel) initChannel();

    return () => {
      client.off('connection.recovered', handleEvent);
      channel?.off?.(handleEvent);
      handleEventStateThrottled.cancel();
      loadMoreFinishedDebounced.cancel();
      loadMoreThreadFinishedDebounced.cancel();
    };
  }, [channel]);

  useEffect(() => {
    if (props.thread) {
      setThread(props.thread);
      setThreadMessages(channel.state.threads?.[props.thread?.id] || []);
    }
  }, [props.thread]);

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
    setLoading(false);
    setMembers(channel.state.members);
    setMessages(channel.state.messages);
    setRead(channel.state.read);
    setTyping(channel.state.typing);
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
    setError(false);
    if (!channel.initialized && channel.cid) {
      try {
        await channel.watch();
      } catch (e) {
        setError(e);
        setLoading(false);
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
      __html: text,
      attachments,
      created_at: new Date(),
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
      __html,
      attachments,
      created_at,
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
    if (loadingMore || hasMore === false) return;
    setLoadingMore(true);

    if (!messages.length) {
      return setLoadingMore(false);
    }

    const oldestMessage = messages?.[0];

    if (oldestMessage?.status !== 'received') {
      return setLoadingMore(false);
    }

    const oldestID = oldestMessage?.id;
    const limit = 100;

    try {
      const queryResponse = await channel.query({
        messages: { id_lt: oldestID, limit },
      });

      const updatedHasMore = queryResponse.messages.length === limit;
      loadMoreFinishedDebounced(updatedHasMore, channel.state.messages);
    } catch (e) {
      console.warn('Message pagination request failed with error', e);
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

  const setEditingState = (message) => setEditing(message);

  const clearEditingState = () => setEditing(false);

  const removeMessage = (message) => {
    channel.state.removeMessage(message);
    setMessages(channel.state.messages);
  };

  /**
   * THREAD METHODS
   */

  const openThread = (message) => {
    const threadMessages = channel.state.threads[message.id] || [];
    setThread(message);
    setThreadMessages(threadMessages);
  };

  const closeThread = () => {
    setThread(null);
    setThreadMessages([]);
  };

  const loadMoreThreadFinished = (threadHasMore, updatedThreadMessages) => {
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
    if (threadLoadingMore || !thread?.id) return;
    setThreadLoadingMore(true);

    const parentID = thread.id;
    const oldMessages = channel.state.threads[parentID] || [];
    const oldestMessageID = oldMessages?.[0]?.id;

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
    disabled: channel?.data?.frozen && disableIfFrozenChannel,
    EmptyStateIndicator,
    error,
    eventHistory,
    lastRead,
    loading,
    markRead: markReadThrottled,
    members,
    read,
    setLastRead,
    typing,
    watcherCount,
    watchers,
  };

  const messagesContext = {
    Attachment: props.Attachment,
    clearEditingState,
    editing,
    editMessage,
    emojiData,
    hasMore,
    loadingMore,
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
    loadMoreThread,
    openThread,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages,
  };

  if (!channel || error) {
    return <LoadingErrorIndicator error={error} listType='message' />;
  }

  if (!channel?.cid || !channel.watch) {
    return (
      <Text style={{ fontWeight: 'bold', padding: 16 }} testID='no-channel'>
        {t('Please select a channel first')}
      </Text>
    );
  }

  if (loading) {
    return <LoadingIndicator listType='message' />;
  }

  const {
    disableKeyboardCompatibleView,
    keyboardBehavior,
    keyboardVerticalOffset,
  } = props;
  return (
    <KeyboardCompatibleView
      behavior={keyboardBehavior}
      enabled={!disableKeyboardCompatibleView}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
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
  /**
   * Custom UI component to display attachments on individual messages
   * Default component (accepts the same props): [Attachment](https://getstream.github.io/stream-chat-react-native/#attachment)
   * */
  Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * The currently active channel
   * */
  channel: PropTypes.shape({
    watch: PropTypes.func,
  }).isRequired,
  /**
   * Disables the channel UI if the channel is frozen
   * */
  disableIfFrozenChannel: PropTypes.bool,
  /**
   * When true, disables the KeyboardCompatibleView wrapper
   *
   * Channel internally uses the [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js)
   * component to adjust the height of Channel when the keyboard is opened or dismissed. This prop provides the ability to disable this functionality in case you
   * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or handle dismissal yourself.
   * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
   * */
  disableKeyboardCompatibleView: PropTypes.bool,
  /**
   * Overrides the Stream default mark channel read request (Advanced usage only)
   * @param channel Channel object
   * */
  doMarkReadRequest: PropTypes.func,
  /**
   * Overrides the Stream default send message request (Advanced usage only)
   * @param channelId
   * @param messageData Message object
   * */
  doSendMessageRequest: PropTypes.func,
  /**
   * Overrides the Stream default update message request (Advanced usage only)
   * @param channelId
   * @param updatedMessage UpdatedMessage object
   * */
  doUpdateMessageRequest: PropTypes.func,
  /**
   * Custom empty state indicator to override the Stream default
   * */
  EmptyStateIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom wrapper component that handles height adjustment of Channel component when keyboard is opened or dismissed
   * Default component (accepts the same props): [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js)
   *
   * **Example:**
   *
   * ```
   * <Channel
   *  channel={channel}
   *  KeyboardCompatibleView={(props) => {
   *    return (
   *      <KeyboardCompatibleView keyboardDismissAnimationDuration={200} keyboardOpenAnimationDuration={200}>
   *        {props.children}
   *      </KeyboardCompatibleView>
   *    )
   *  }}
   * />
   * ```
   */
  KeyboardCompatibleView: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom loading error indicator to override the Stream default
   * */
  LoadingErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom loading indicator to override the Stream default
   * */
  LoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   * */
  Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default Channel;
