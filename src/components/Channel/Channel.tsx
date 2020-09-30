import React, { PropsWithChildren, useEffect, useState } from 'react';
import { KeyboardAvoidingViewProps, Text } from 'react-native';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import Immutable from 'seamless-immutable';
import {
  ChannelState,
  Channel as ChannelType,
  Event,
  EventHandler,
  logChatPromiseExecution,
  MessageResponse,
  SendMessageAPIResponse,
  StreamChat,
  Message as StreamMessage,
} from 'stream-chat';
import uuidv4 from 'uuid/v4';

import AttachmentDefault from '../Attachment/Attachment';
import EmptyStateIndicatorDefault from '../Indicators/EmptyStateIndicator';
import LoadingErrorIndicatorDefault from '../Indicators/LoadingErrorIndicator';
import LoadingIndicatorDefault from '../Indicators/LoadingIndicator';
import KeyboardCompatibleViewDefault from '../KeyboardCompatibleView/KeyboardCompatibleView';

import {
  ChannelContextValue,
  ChannelProvider,
} from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  MessagesContextValue,
  MessagesProvider,
} from '../../contexts/messagesContext/MessagesContext';
import { SuggestionsProvider } from '../../contexts/suggestionsContext/SuggestionsContext';
import {
  ThreadContextValue,
  ThreadProvider,
} from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { emojiData as emojiDataDefault } from '../../utils/utils';

import type { LoadingErrorProps } from '../Indicators/LoadingErrorIndicator';
import type { LoadingProps } from '../Indicators/LoadingIndicator';
import type { Message as MessageType } from '../MessageList/utils/insertDates';
import type { KeyboardCompatibleViewProps } from '../KeyboardCompatibleView/KeyboardCompatibleView';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ChannelProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * The currently active channel
   */
  channel: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['channel'];
  /**
   * Custom UI component to display attachments on individual messages
   * Default component (accepts the same props): [Attachment](https://getstream.github.io/stream-chat-react-native/#attachment)
   */
  Attachment?: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['Attachment'];
  /**
   * Disables the channel UI if the channel is frozen
   */
  disableIfFrozenChannel?: boolean;
  /**
   * When true, disables the KeyboardCompatibleView wrapper
   *
   * Channel internally uses the [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx)
   * component to adjust the height of Channel when the keyboard is opened or dismissed. This prop provides the ability to disable this functionality in case you
   * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or handle dismissal yourself.
   * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
   */
  disableKeyboardCompatibleView?: boolean;
  /**
   * Overrides the Stream default mark channel read request (Advanced usage only)
   * @param channel Channel object
   */
  doMarkReadRequest?: (
    channel: ChannelType<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * Overrides the Stream default send message request (Advanced usage only)
   * @param channelId
   * @param messageData Message object
   */
  doSendMessageRequest?: (
    channelId: string,
    messageData: StreamMessage<At, Me, Us>,
  ) => Promise<SendMessageAPIResponse<At, Ch, Co, Me, Re, Us>>;
  /**
   * Overrides the Stream default update message request (Advanced usage only)
   * @param channelId
   * @param updatedMessage UpdatedMessage object
   */
  doUpdateMessageRequest?: (
    channelId: string,
    updatedMessage: StreamMessage<At, Me, Us>,
  ) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;
  emojiData?: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['emojiData'];
  /**
   * Custom empty state indicator to override the Stream default
   */
  EmptyStateIndicator?: ChannelContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['EmptyStateIndicator'];
  keyboardBehavior?: KeyboardAvoidingViewProps['behavior'];
  /**
   * Custom wrapper component that handles height adjustment of Channel component when keyboard is opened or dismissed
   * Default component (accepts the same props): [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx)
   *
   * **Example:**
   *
   * ```
   * <Channel
   *  channel={channel}
   *  KeyboardCompatibleView={(props) => {
   *    return (
   *      <KeyboardCompatibleView>
   *        {props.children}
   *      </KeyboardCompatibleView>
   *    )
   *  }}
   * />
   * ```
   */
  KeyboardCompatibleView?: React.ComponentType<
    Partial<KeyboardCompatibleViewProps>
  >;
  keyboardVerticalOffset?: number;
  /**
   * Custom loading error indicator to override the Stream default
   */
  LoadingErrorIndicator?: React.ComponentType<Partial<LoadingErrorProps>>;
  /**
   * Custom loading indicator to override the Stream default
   */
  LoadingIndicator?: React.ComponentType<Partial<LoadingProps>>;
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   */
  Message?: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['Message'];
  thread?: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread'];
};

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList, Thread, and MessageInput must be
 * children of the Channel component to receive the ChannelContext.
 *
 * @example ./Channel.md
 */
const Channel = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  Attachment = AttachmentDefault,
  channel,
  children,
  disableIfFrozenChannel = true,
  disableKeyboardCompatibleView = false,
  doMarkReadRequest,
  doSendMessageRequest,
  doUpdateMessageRequest,
  emojiData = emojiDataDefault,
  EmptyStateIndicator = EmptyStateIndicatorDefault,
  keyboardBehavior,
  KeyboardCompatibleView = KeyboardCompatibleViewDefault,
  keyboardVerticalOffset,
  LoadingErrorIndicator = LoadingErrorIndicatorDefault,
  LoadingIndicator = LoadingIndicatorDefault,
  Message,
  thread: threadProps,
}: PropsWithChildren<ChannelProps<At, Ch, Co, Ev, Me, Re, Us>>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const [editing, setEditing] = useState<
    boolean | MessageType<At, Ch, Co, Ev, Me, Re, Us>
  >(false);
  const [error, setError] = useState(false);
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
  const [eventHistory, setEventHistory] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['eventHistory']
  >({});
  const [hasMore, setHasMore] = useState(true);
  const [lastRead, setLastRead] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['lastRead']
  >();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [members, setMembers] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['members']
  >({} as ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['members']);
  const [messages, setMessages] = useState<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages']
  >(Immutable([]));
  const [read, setRead] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read']
  >({} as ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read']);
  const [thread, setThread] = useState<
    ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread']
  >(threadProps || null);
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);
  const [threadMessages, setThreadMessages] = useState<
    ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['threadMessages']
  >(
    (threadProps?.id && channel?.state?.threads?.[threadProps.id]) ||
      Immutable([]),
  );
  const [typing, setTyping] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['typing']
  >({} as ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['typing']);
  const [watcherCount, setWatcherCount] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['watcherCount']
  >();
  const [watchers, setWatchers] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['watchers']
  >({} as ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['watchers']);

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
    if (threadProps) {
      setThread(threadProps);
      if (channel && threadProps?.id) {
        setThreadMessages(channel.state.threads?.[threadProps.id] || []);
      }
    }
  }, [threadProps]);

  /**
   * CHANNEL METHODS
   */

  const markRead: ChannelContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['markRead'] = () => {
    if (channel?.disconnected || !channel?.getConfig?.()?.read_events) {
      return;
    }

    if (doMarkReadRequest) {
      doMarkReadRequest(channel);
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
    if (channel) {
      setMembers(channel.state.members);
      setMessages(channel.state.messages);
      setRead(channel.state.read);
      setTyping(channel.state.typing);
      setWatcherCount(channel.state.watcher_count);
      setWatchers(channel.state.watchers);

      if (channel.countUnread() > 0) {
        markReadThrottled();
      }
    }
  };

  const addToEventHistory = (e: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
    const lastMessageId = messages.length
      ? messages[messages.length - 1].id
      : 'none';

    if (lastMessageId) {
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
    }
  };

  const handleEventStateChange = (
    channelState: ChannelState<At, Ch, Co, Ev, Me, Re, Us>,
  ) => {
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

  const handleEvent: EventHandler<At, Ch, Co, Ev, Me, Re, Us> = (e) => {
    if (thread) {
      const updatedThreadMessages =
        (thread.id && channel && channel.state.threads[thread.id]) ||
        threadMessages;
      setThreadMessages(updatedThreadMessages);
    }

    if (channel && thread && e.message && e.message.id === thread.id) {
      const updatedThread = channel.state.messageToImmutable(e.message);
      setThread(updatedThread);
    }

    if (e.type === 'member.added') addToEventHistory(e);
    if (e.type === 'member.removed') addToEventHistory(e);

    if (channel) {
      handleEventStateThrottled(channel.state);
    }
  };

  const listenToChanges = () => {
    // The more complex sync logic is done in Chat.js
    // listen to client.connection.recovered and all channel events
    client.on('connection.recovered', handleEvent);
    channel?.on(handleEvent);
  };

  const initChannel = async () => {
    let initError = false;
    setError(false);
    setLoading(true);

    if (channel && !channel.initialized && channel.cid) {
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

  const updateMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['updateMessage'] = (updatedMessage, extraState = {}) => {
    if (channel) {
      channel.state.addMessageSorted(updatedMessage);
      if (thread && updatedMessage.parent_id) {
        extraState.threadMessages =
          channel.state.threads[updatedMessage.parent_id] || [];
        setThreadMessages(extraState.threadMessages);
      }

      setMessages(channel.state.messages);
    }
  };

  const createMessagePreview = ({
    attachments,
    extraFields,
    mentioned_users,
    parent_id,
    text,
  }: {
    attachments?: StreamMessage<At, Me, Us>['attachments'];
    extraFields?: Partial<StreamMessage<At, Me, Us>>;
    mentioned_users?: StreamMessage<At, Me, Us>['mentioned_users'];
    parent_id?: StreamMessage<At, Me, Us>['parent_id'];
    text?: StreamMessage<At, Me, Us>['text'];
  }): MessageResponse<At, Ch, Co, Me, Re, Us> => {
    const message = {
      __html: text,
      attachments,
      created_at: new Date(),
      html: text,
      id: `${client.userID}-${uuidv4()}`,
      mentioned_users,
      parent_id,
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

    return (message as unknown) as MessageResponse<At, Ch, Co, Me, Re, Us>;
  };

  const sendMessageRequest = async (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      __html,
      attachments,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      created_at,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      html,
      id,
      mentioned_users,
      parent_id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reactions,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      status,
      text,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    } as StreamMessage<At, Me, Us>;

    try {
      let messageResponse = {} as SendMessageAPIResponse<
        At,
        Ch,
        Co,
        Me,
        Re,
        Us
      >;

      if (doSendMessageRequest) {
        messageResponse = await doSendMessageRequest(
          channel?.cid || '',
          messageData,
        );
      } else if (channel) {
        messageResponse = await channel.sendMessage(messageData);
      }

      if (messageResponse.message) {
        messageResponse.message.status = 'received';
        updateMessage(messageResponse.message);
      }
    } catch (err) {
      console.log(err);
      message.status = 'failed';
      updateMessage(message);
    }
  };

  const sendMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['sendMessage'] = async ({
    attachments = [],
    mentioned_users,
    parent_id,
    text,
    ...extraFields
  }) => {
    channel?.state?.filterErrorMessages();

    const messagePreview = createMessagePreview({
      attachments,
      extraFields: extraFields as Partial<StreamMessage<At, Me, Us>>,
      mentioned_users,
      parent_id,
      text,
    });

    updateMessage(messagePreview, {
      commands: [],
      messageInput: '',
    });

    await sendMessageRequest(messagePreview);
  };

  const retrySendMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['retrySendMessage'] = async (message) => {
    message = { ...message, status: 'sending' };
    updateMessage(message);
    await sendMessageRequest(message);
  };

  const loadMoreFinished = (
    updatedHasMore: boolean,
    newMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'],
  ) => {
    setLoadingMore(false);
    setHasMore(updatedHasMore);
    setMessages(newMessages);
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

    const oldestMessage = messages && messages[0];

    if (oldestMessage && oldestMessage.status !== 'received') {
      return setLoadingMore(false);
    }

    const oldestID = oldestMessage && oldestMessage.id;
    const limit = 100;

    try {
      if (channel) {
        const queryResponse = await channel.query({
          messages: { id_lt: oldestID, limit },
        });

        const updatedHasMore = queryResponse.messages.length === limit;
        loadMoreFinishedDebounced(updatedHasMore, channel.state.messages);
      }
    } catch (e) {
      console.warn('Message pagination request failed with error', e);
      return setLoadingMore(false);
    }
  };

  const loadMoreThrottled: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['loadMore'] = throttle(loadMore, 2000, {
    leading: true,
    trailing: true,
  });

  const editMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['editMessage'] = (updatedMessage) => {
    if (doUpdateMessageRequest) {
      return doUpdateMessageRequest(channel?.cid || '', updatedMessage);
    }
    return client.updateMessage(updatedMessage);
  };

  const setEditingState: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['setEditingState'] = (message) => {
    setEditing(message);
  };

  const clearEditingState: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['clearEditingState'] = () => setEditing(false);

  const removeMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['removeMessage'] = (message) => {
    if (channel) {
      channel.state.removeMessage(message);
      setMessages(channel.state.messages);
    }
  };

  /**
   * THREAD METHODS
   */

  const openThread: ThreadContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['openThread'] = (message) => {
    const newThreadMessages = message?.id
      ? channel?.state?.threads[message.id] || []
      : [];
    setThread(message);
    setThreadMessages(
      newThreadMessages as ThreadContextValue<
        At,
        Ch,
        Co,
        Ev,
        Me,
        Re,
        Us
      >['threadMessages'],
    );
  };

  const closeThread: ThreadContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['closeThread'] = () => {
    setThread(null);
    setThreadMessages(Immutable([]));
  };

  const loadMoreThreadFinished = (
    newThreadHasMore: boolean,
    updatedThreadMessages: ChannelState<
      At,
      Ch,
      Co,
      Ev,
      Me,
      Re,
      Us
    >['threads'][string],
  ) => {
    setThreadHasMore(newThreadHasMore);
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

  const loadMoreThread: ThreadContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['loadMoreThread'] = async () => {
    if (threadLoadingMore || !(thread && thread.id)) return;
    setThreadLoadingMore(true);

    if (channel) {
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
    }
  };

  const channelContext: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us> = {
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

  const messagesContext: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us> = {
    Attachment,
    clearEditingState,
    editing,
    editMessage,
    emojiData,
    hasMore,
    loadingMore,
    loadMore: loadMoreThrottled,
    Message,
    messages,
    removeMessage,
    retrySendMessage,
    sendMessage,
    setEditingState,
    updateMessage,
  };

  const threadContext: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us> = {
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

  return (
    <KeyboardCompatibleView
      behavior={keyboardBehavior}
      enabled={!disableKeyboardCompatibleView}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ChannelProvider<At, Ch, Co, Ev, Me, Re, Us> value={channelContext}>
        <MessagesProvider<At, Ch, Co, Ev, Me, Re, Us> value={messagesContext}>
          <ThreadProvider<At, Ch, Co, Ev, Me, Re, Us> value={threadContext}>
            <SuggestionsProvider<Co, Us>>{children}</SuggestionsProvider>
          </ThreadProvider>
        </MessagesProvider>
      </ChannelProvider>
    </KeyboardCompatibleView>
  );
};

export default Channel;
