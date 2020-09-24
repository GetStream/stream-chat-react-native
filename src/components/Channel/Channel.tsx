import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Text } from 'react-native';
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
  Message as MessageType,
  StreamChat,
} from 'stream-chat';
import uuidv4 from 'uuid/v4';

import AttachmentDefault, { AttachmentProps } from '../Attachment/Attachment';
import EmptyStateIndicatorDefault from '../Indicators/EmptyStateIndicator';
import LoadingErrorIndicatorDefault from '../Indicators/LoadingErrorIndicator';
import LoadingIndicatorDefault from '../Indicators/LoadingIndicator';
import KeyboardCompatibleViewDefault from '../KeyboardCompatibleView/KeyboardCompatibleView';
import MessageDefault from '../Message/Message';

import type { EmptyStateProps } from '../Indicators/EmptyStateIndicator';
import type { LoadingErrorProps } from '../Indicators/LoadingErrorIndicator';
import type { LoadingProps } from '../Indicators/LoadingIndicator';
import type { KeyboardCompatibleViewProps } from '../KeyboardCompatibleView/KeyboardCompatibleView';
import type { Message as InsertMessageType } from '../MessageList/utils/insertDates';
import type { Reaction } from '../Reaction/ReactionList';

import {
  ChannelContextValue,
  ChannelProvider,
} from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  MessagesContextValue,
  MessagesProvider,
  MessageWithDates,
} from '../../contexts/messagesContext/MessagesContext';
import {
  SuggestionCommand,
  SuggestionsProvider,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import {
  ThreadContextValue,
  ThreadProvider,
} from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { emojiData as emojiDataDefault } from '../../utils/utils';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList, Thread, and MessageInput must be
 * children of the Channel component to receive the ChannelContext.
 *
 * @example ./Channel.md
 */
const Channel = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
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
  KeyboardCompatibleView = KeyboardCompatibleViewDefault,
  LoadingErrorIndicator = LoadingErrorIndicatorDefault,
  LoadingIndicator = LoadingIndicatorDefault,
  Message = MessageDefault,
  thread: threadProps,
}: PropsWithChildren<ChannelProps<At, Ch, Co, Ev, Me, Re, Us>>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const [editing, setEditing] = useState(false);
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
  const [eventHistory, setEventHistory] = useState<{
    [key: string]: Event<At, Ch, Co, Ev, Me, Re, Us>[];
  }>({});
  const [hasMore, setHasMore] = useState(true);
  const [lastRead, setLastRead] = useState<Date>();
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
  const [watcherCount, setWatcherCount] = useState<number>();
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
      if (threadProps?.id) {
        setThreadMessages(channel.state.threads?.[threadProps.id] || []);
      }
    }
  }, [threadProps]);

  /**
   * CHANNEL METHODS
   */

  const markRead = () => {
    if (channel.disconnected || !channel?.getConfig?.()?.read_events) {
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
        (thread.id && channel.state.threads[thread.id]) || threadMessages;
      setThreadMessages(updatedThreadMessages);
    }

    if (thread && e.message && e.message.id === thread.id) {
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

  const updateMessage = (
    updatedMessage: MessageType<At, Me, Us>,
    extraState: {
      commands?: SuggestionCommand<Co>[];
      messageInput?: string;
      threadMessages?: ChannelState<
        At,
        Ch,
        Co,
        Ev,
        Me,
        Re,
        Us
      >['threads'][string];
    } = {},
  ) => {
    channel.state.addMessageSorted(
      updatedMessage as MessageResponse<At, Ch, Co, Me, Re, Us>,
    );

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
  }: {
    attachments?: MessageType<At, Me, Us>['attachments'];
    extraFields?: Partial<MessageType<At, Me, Us>>;
    mentioned_users?: MessageType<At, Me, Us>['mentioned_users'];
    parent?: MessageType<At, Me, Us>['parent_id'];
    text?: MessageType<At, Me, Us>['text'];
  }): MessageType<At, Me, Us> => {
    const message = {
      __html: text,
      attachments,
      created_at: new Date(),
      html: text,
      id: `${client.userID}-${uuidv4()}`,
      mentioned_users,
      parent_id: parent,
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

    return (message as unknown) as MessageType<At, Me, Us>;
  };

  const sendMessageRequest = async (message: MessageType<At, Me, Us>) => {
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
    };

    try {
      let messageResponse;

      if (doSendMessageRequest) {
        messageResponse = await doSendMessageRequest(
          channel.cid,
          messageData as MessageType<At, Me, Us>,
        );
      } else {
        messageResponse = await channel.sendMessage(
          messageData as MessageType<At, Me, Us>,
        );
      }

      if (messageResponse.message) {
        messageResponse.message.status = 'received';
        updateMessage(messageResponse.message as MessageType<At, Me, Us>);
      }
    } catch (err) {
      console.log(err);
      updateMessage({ ...message, status: 'failed' });
    }
  };

  const sendMessage = async ({
    attachments = [],
    mentioned_users,
    parent,
    text,
    ...extraFields
  }: {
    attachments?: MessageType<At, Me, Us>['attachments'];
    extraFields?: Partial<MessageType<At, Me, Us>>;
    mentioned_users?: MessageType<At, Me, Us>['mentioned_users'];
    parent?: MessageType<At, Me, Us>['parent_id'];
    text?: MessageType<At, Me, Us>['text'];
  }) => {
    channel.state.filterErrorMessages();

    const messagePreview = createMessagePreview({
      attachments,
      extraFields: extraFields as Partial<MessageType<At, Me, Us>>,
      mentioned_users,
      parent,
      text,
    });

    updateMessage(messagePreview, {
      commands: [],
      messageInput: '',
    });

    await sendMessageRequest(messagePreview);
  };

  const retrySendMessage = async (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => {
    message.status = 'sending';
    updateMessage(message as MessageType<At, Me, Us>);
    await sendMessageRequest(message as MessageType<At, Me, Us>);
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

  const editMessage = (
    updatedMessage: MessageWithDates<At, Ch, Co, Me, Re, Us>,
  ) => {
    if (doUpdateMessageRequest) {
      return doUpdateMessageRequest(
        channel.cid,
        updatedMessage as MessageType<At, Me, Us>,
      );
    }
    return client.updateMessage(updatedMessage as MessageType<At, Me, Us>);
  };

  const setEditingState = (message: InsertMessageType) => setEditing(!!message);

  const clearEditingState = () => setEditing(false);

  const removeMessage = (message: {
    id: string;
    parent_id?: string | undefined;
  }) => {
    channel.state.removeMessage(message);
    setMessages(channel.state.messages);
  };

  /**
   * THREAD METHODS
   */

  const openThread = (message: MessageWithDates<At, Ch, Co, Me, Re, Us>) => {
    const newThreadMessages = message?.id
      ? channel.state.threads[message.id] || []
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

  const closeThread = () => {
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

  const loadMoreThread = async () => {
    if (threadLoadingMore || !(thread && thread.id)) return;
    setThreadLoadingMore(true);

    const parentID = thread.id;
    const oldMessages = channel.state.threads[parentID] || [];
    const oldestMessageID = oldMessages && oldMessages[0] && oldMessages[0].id;

    const limit = 50;
    const queryResponse = await channel.getReplies(parentID, {
      id_lt: oldestMessageID,
      limit,
    });

    const updatedHasMore = queryResponse.messages.length === limit;
    const updatedThreadMessages = channel.state.threads[parentID] || [];
    loadMoreThreadFinishedDebounced(updatedHasMore, updatedThreadMessages);
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
    <KeyboardCompatibleView enabled={!disableKeyboardCompatibleView}>
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

export type ChannelProps<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
> = {
  /**
   * The currently active channel
   */
  channel: ChannelType<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Custom UI component to display attachments on individual messages
   * Default component (accepts the same props): [Attachment](https://getstream.github.io/stream-chat-react-native/#attachment)
   */
  Attachment?: React.ComponentType<AttachmentProps<At>>;
  /**
   * Disables the channel UI if the channel is frozen
   */
  disableIfFrozenChannel?: boolean;
  /**
   * When true, disables the KeyboardCompatibleView wrapper
   *
   * Channel internally uses the [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js)
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
    messageData: MessageType<At, Me, Us>,
  ) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;
  /**
   * Overrides the Stream default update message request (Advanced usage only)
   * @param channelId
   * @param updatedMessage UpdatedMessage object
   */
  doUpdateMessageRequest?: (
    channelId: string,
    updatedMessage: MessageType<At, Me, Us>,
  ) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;
  emojiData?: Reaction[];
  /**
   * Custom empty state indicator to override the Stream default
   */
  EmptyStateIndicator?: React.ComponentType<Partial<EmptyStateProps>>;
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
  KeyboardCompatibleView?: React.ComponentType<
    Partial<KeyboardCompatibleViewProps>
  >;
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
  Message?: React.ComponentType<Partial<unknown>>; // TODO: type when Message component is done
  thread?: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread'];
};

export default Channel;
