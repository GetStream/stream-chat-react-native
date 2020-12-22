import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  KeyboardAvoidingViewProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import Immutable from 'seamless-immutable';
import {
  ChannelState,
  Channel as ChannelType,
  EventHandler,
  logChatPromiseExecution,
  MessageResponse,
  SendMessageAPIResponse,
  StreamChat,
  Message as StreamMessage,
} from 'stream-chat';

import { useCreateChannelContext } from './hooks/useCreateChannelContext';
import { useCreateInputMessageInputContext } from './hooks/useCreateInputMessageInputContext';
import { useCreateMessagesContext } from './hooks/useCreateMessagesContext';
import { useCreateThreadContext } from './hooks/useCreateThreadContext';

import { Attachment as AttachmentDefault } from '../Attachment/Attachment';
import { AttachmentActions as AttachmentActionsDefault } from '../Attachment/AttachmentActions';
import { Card as CardDefault } from '../Attachment/Card';
import { FileAttachment as FileAttachmentDefault } from '../Attachment/FileAttachment';
import { FileAttachmentGroup as FileAttachmentGroupDefault } from '../Attachment/FileAttachmentGroup';
import { FileIcon as FileIconDefault } from '../Attachment/FileIcon';
import { Gallery as GalleryDefault } from '../Attachment/Gallery';
import { Giphy as GiphyDefault } from '../Attachment/Giphy';
import { EmptyStateIndicator as EmptyStateIndicatorDefault } from '../Indicators/EmptyStateIndicator';
import {
  LoadingErrorIndicator as LoadingErrorIndicatorDefault,
  LoadingErrorProps,
} from '../Indicators/LoadingErrorIndicator';
import { LoadingIndicator as LoadingIndicatorDefault } from '../Indicators/LoadingIndicator';
import { KeyboardCompatibleView as KeyboardCompatibleViewDefault } from '../KeyboardCompatibleView/KeyboardCompatibleView';
import { Message as MessageDefault } from '../Message/Message';
import { MessageAvatar as MessageAvatarDefault } from '../Message/MessageSimple/MessageAvatar';
import { MessageContent as MessageContentDefault } from '../Message/MessageSimple/MessageContent';
import { MessageReplies as MessageRepliesDefault } from '../Message/MessageSimple/MessageReplies';
import { MessageSimple as MessageSimpleDefault } from '../Message/MessageSimple/MessageSimple';
import { MessageStatus as MessageStatusDefault } from '../Message/MessageSimple/MessageStatus';
import { ReactionList as ReactionListDefault } from '../Message/MessageSimple/ReactionList';
import { AttachButton as AttachButtonDefault } from '../MessageInput/AttachButton';
import { CommandsButton as CommandsButtonDefault } from '../MessageInput/CommandsButton';
import { FileUploadPreview as FileUploadPreviewDefault } from '../MessageInput/FileUploadPreview';
import { ImageUploadPreview as ImageUploadPreviewDefault } from '../MessageInput/ImageUploadPreview';
import { MoreOptionsButton as MoreOptionsButtonDefault } from '../MessageInput/MoreOptionsButton';
import { SendButton as SendButtonDefault } from '../MessageInput/SendButton';
import { ShowThreadMessageInChannelButton as ShowThreadMessageInChannelButtonDefault } from '../MessageInput/ShowThreadMessageInChannelButton';
import { UploadProgressIndicator as UploadProgressIndicatorDefault } from '../MessageInput/UploadProgressIndicator';
import { DateHeader as DateHeaderDefault } from '../MessageList/DateHeader';
import { InlineUnreadIndicator as InlineUnreadIndicatorDefault } from '../MessageList/InlineUnreadIndicator';
import { MessageList as MessageListDefault } from '../MessageList/MessageList';
import { MessageNotification as MessageNotificationDefault } from '../MessageList/MessageNotification';
import { MessageSystem as MessageSystemDefault } from '../MessageList/MessageSystem';
import { TypingIndicator as TypingIndicatorDefault } from '../MessageList/TypingIndicator';
import { TypingIndicatorContainer as TypingIndicatorContainerDefault } from '../MessageList/TypingIndicatorContainer';
import { Reply as ReplyDefault } from '../Reply/Reply';

import {
  ChannelContextValue,
  ChannelProvider,
} from '../../contexts/channelContext/ChannelContext';
import {
  ChatContextValue,
  useChatContext,
} from '../../contexts/chatContext/ChatContext';
import {
  InputMessageInputContextValue,
  MessageInputProvider,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  ActionProps,
  MessagesContextValue,
  MessagesProvider,
} from '../../contexts/messagesContext/MessagesContext';
import {
  SuggestionsContextValue,
  SuggestionsProvider,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  ThreadProvider,
} from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { FlatList as FlatListDefault } from '../../native';
import { reactionData as reactionDataDefault } from '../../utils/utils';

import type { Message as MessageType } from '../MessageList/hooks/useMessageList';

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
import { generateRandomId } from '../../utils/utils';
import { useTargetedMessage } from './hooks/useTargetedMessage';

const styles = StyleSheet.create({
  selectChannel: { fontWeight: 'bold', padding: 16 },
});

const limitForUnreadScrolledUp = 4;

export type ChannelPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Pick<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'channel'
    | 'EmptyStateIndicator'
    | 'enforceUniqueReaction'
    | 'giphyEnabled'
    | 'initialScrollToFirstUnreadMessage'
    | 'LoadingIndicator'
    | 'StickyHeader'
  >
> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Partial<InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>> &
  Partial<SuggestionsContextValue<Co, Us>> &
  Pick<TranslationContextValue, 't'> &
  Partial<
    Pick<
      MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      | 'additionalTouchableProps'
      | 'Attachment'
      | 'AttachmentActions'
      | 'AttachmentFileIcon'
      | 'Card'
      | 'CardCover'
      | 'CardFooter'
      | 'CardHeader'
      | 'DateHeader'
      | 'disableTypingIndicator'
      | 'dismissKeyboardOnMessageTouch'
      | 'FileAttachment'
      | 'FileAttachmentGroup'
      | 'FlatList'
      | 'formatDate'
      | 'Gallery'
      | 'Giphy'
      | 'InlineUnreadIndicator'
      | 'markdownRules'
      | 'Message'
      | 'MessageAvatar'
      | 'MessageContent'
      | 'messageContentOrder'
      | 'MessageFooter'
      | 'MessageHeader'
      | 'MessageList'
      | 'MessageNotification'
      | 'MessageReplies'
      | 'MessageSimple'
      | 'MessageStatus'
      | 'MessageSystem'
      | 'MessageText'
      | 'ReactionList'
      | 'Reply'
      | 'supportedReactions'
      | 'TypingIndicator'
      | 'TypingIndicatorContainer'
      | 'UrlPreview'
    >
  > &
  Partial<
    Pick<
      ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      'allowThreadMessagesInChannel' | 'thread'
    >
  > & {
    /**
     * Additional props passed to keyboard avoiding view
     */
    additionalKeyboardAvoidingViewProps?: Partial<KeyboardAvoidingViewProps>;
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
      updatedMessage: Parameters<
        StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']
      >[0],
    ) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;
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
    KeyboardCompatibleView?: React.ComponentType<KeyboardAvoidingViewProps>;
    keyboardVerticalOffset?: number;
    /**
     * Custom loading error indicator to override the Stream default
     */
    LoadingErrorIndicator?: React.ComponentType<LoadingErrorProps>;
    messageId?: string;
  };

export const ChannelWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: PropsWithChildren<ChannelPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const {
    additionalKeyboardAvoidingViewProps,
    additionalTextInputProps,
    additionalTouchableProps,
    allowThreadMessagesInChannel = true,
    AttachButton = AttachButtonDefault,
    Attachment = AttachmentDefault,
    AttachmentActions = AttachmentActionsDefault,
    AttachmentFileIcon = FileIconDefault,
    Card = CardDefault,
    CardCover,
    CardFooter,
    CardHeader,
    channel,
    children,
    client,
    closeSuggestions,
    CommandsButton = CommandsButtonDefault,
    compressImageQuality,
    DateHeader = DateHeaderDefault,
    disableIfFrozenChannel = true,
    disableKeyboardCompatibleView = false,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch = true,
    doDocUploadRequest,
    doImageUploadRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    enforceUniqueReaction = false,
    FileAttachment = FileAttachmentDefault,
    FileAttachmentGroup = FileAttachmentGroupDefault,
    FileUploadPreview = FileUploadPreviewDefault,
    FlatList = FlatListDefault,
    formatDate,
    Gallery = GalleryDefault,
    Giphy = GiphyDefault,
    giphyEnabled,
    hasFilePicker = true,
    hasImagePicker = true,
    ImageUploadPreview = ImageUploadPreviewDefault,
    initialScrollToFirstUnreadMessage = false,
    initialValue,
    InlineUnreadIndicator = InlineUnreadIndicatorDefault,
    Input,
    keyboardBehavior,
    KeyboardCompatibleView = KeyboardCompatibleViewDefault,
    keyboardVerticalOffset,
    LoadingErrorIndicator = LoadingErrorIndicatorDefault,
    LoadingIndicator = LoadingIndicatorDefault,
    markdownRules,
    messageId,
    maxNumberOfFiles = 10,
    Message = MessageDefault,
    MessageAvatar = MessageAvatarDefault,
    MessageContent = MessageContentDefault,
    messageContentOrder = ['gallery', 'files', 'text', 'attachments'],
    MessageFooter,
    MessageHeader,
    MessageList = MessageListDefault,
    MessageNotification = MessageNotificationDefault,
    MessageReplies = MessageRepliesDefault,
    MessageSimple = MessageSimpleDefault,
    MessageStatus = MessageStatusDefault,
    MessageSystem = MessageSystemDefault,
    MessageText,
    MoreOptionsButton = MoreOptionsButtonDefault,
    numberOfLines = 5,
    onChangeText,
    openSuggestions,
    ReactionList = ReactionListDefault,
    Reply = ReplyDefault,
    SendButton = SendButtonDefault,
    sendImageAsync = false,
    setInputRef,
    ShowThreadMessageInChannelButton = ShowThreadMessageInChannelButtonDefault,
    StickyHeader,
    supportedReactions = reactionDataDefault,
    t,
    thread: threadProps,
    TypingIndicator = TypingIndicatorDefault,
    TypingIndicatorContainer = TypingIndicatorContainerDefault,
    updateSuggestions,
    UploadProgressIndicator = UploadProgressIndicatorDefault,
    UrlPreview = CardDefault,
  } = props;

  const {
    theme: {
      channel: { selectChannel },
    },
  } = useTheme();

  const [editing, setEditing] = useState<
    boolean | MessageType<At, Ch, Co, Ev, Me, Re, Us>
  >(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastRead, setLastRead] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['lastRead']
  >();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
  const [messages, setMessages] = useState<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages']
  >(Immutable([]));

  const [members, setMembers] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['members']
  >({} as ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['members']);
  const [read, setRead] = useState<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read']
  >({} as ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read']);
  const [replyTo, setReplyTo] = useState<
    boolean | MessageType<At, Ch, Co, Ev, Me, Re, Us>
  >(false);
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

  const { setTargetedMessage, targetedMessage } = useTargetedMessage(messageId);

  useEffect(() => {
    if (channel) {
      if (messageId) {
        loadChannelAtMessage({ messageId });
      } else if (
        initialScrollToFirstUnreadMessage &&
        channel.countUnread() > 0
      ) {
        loadChannelAtFirstUnreadMessage();
      } else {
        loadChannel();
      }
    }

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
        setThreadMessages(
          channel.state.threads?.[threadProps.id] || Immutable([]),
        );
      }
    } else {
      setThread(null);
    }
  }, [threadProps]);

  /**
   * CHANNEL CONSTS
   */

  const isAdmin =
    client?.user?.role === 'admin' ||
    channel?.state.membership.role === 'admin';

  const isModerator =
    channel?.state.membership.role === 'channel_moderator' ||
    channel?.state.membership.role === 'moderator';

  const isOwner = channel?.state.membership.role === 'owner';

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
    }
  };

  const handleEventStateThrottled = throttle(copyChannelState, 500, {
    leading: true,
    trailing: true,
  });

  const handleEvent: EventHandler<At, Ch, Co, Ev, Me, Re, Us> = (event) => {
    if (thread) {
      const updatedThreadMessages =
        (thread.id && channel && channel.state.threads[thread.id]) ||
        threadMessages;
      setThreadMessages(updatedThreadMessages);
    }

    if (channel && thread && event.message?.id === thread.id) {
      const updatedThread = channel.state.messageToImmutable(event.message);
      setThread(updatedThread);
    }

    if (channel) {
      handleEventStateThrottled();
    }
  };

  const listenToChanges = () => {
    // The more complex sync logic is done in Chat.js
    // listen to client.connection.recovered and all channel events
    client.on('connection.recovered', handleEvent);
    channel?.on(handleEvent);
  };

  const channelQueryCall = async (queryCall: () => void = () => null) => {
    setError(false);
    setLoading(true);

    try {
      await queryCall();
      setLastRead(new Date());
      copyChannelState();
      listenToChanges();
    } catch (err) {
      setError(err);
      setLoading(false);
      setLastRead(new Date());
    }
  };

  const loadChannelAtFirstUnreadMessage = () => {
    if (!channel) return;

    if (
      channel.countUnread() <= limitForUnreadScrolledUp ||
      !channel.state.isUpToDate
    ) {
      return loadChannel();
    }

    channel.state.setIsUptoDate(false);

    return channelQueryCall(() =>
      query(
        Math.max(channel.countUnread() - limitForUnreadScrolledUp / 2, 0),
        30,
      ),
    );
  };

  /**
   * Loads channel at specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   * @param before Number of message to query before messageId
   * @param after Number of message to query after messageId
   */
  const loadChannelAtMessage: ChannelContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['loadChannelAtMessage'] = ({ after = 2, before = 10, messageId }) =>
    channelQueryCall(() => {
      queryAtMessage({ after, before, messageId });

      if (messageId) {
        setTargetedMessage(messageId);
      }
    });

  const loadChannel = () =>
    channelQueryCall(() => {
      if (!channel?.initialized) {
        channel?.watch();
      }
    });

  const reloadChannel = async () =>
    channel ? await loadChannelAtMessage({ before: 30 }) : undefined;

  /**
   * Makes a query to load messages in channel.
   */
  const query = async (offset = 0, limit = 30) => {
    if (!channel) return;
    channel.state.clearMessages();

    await channel.query({
      messages: {
        limit,
        offset,
      },
      watch: true,
    });

    channel.state.setIsUptoDate(offset === 0);
  };

  /**
   * Makes a query to load messages at particular message id.
   *
   * @param messageId Targeted message id
   * @param before Number of messages to load before messageId
   * @param after Number of messages to load after messageId
   */
  const queryAtMessage = async ({
    after = 10,
    before = 10,
    messageId,
  }: Parameters<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['loadChannelAtMessage']
  >[0]) => {
    if (!channel) return;
    channel.state.setIsUptoDate(false);
    channel.state.clearMessages();

    if (!messageId) {
      channel.query({
        messages: {
          limit: before,
        },
        watch: true,
      });

      channel.state.setIsUptoDate(true);
      return;
    }

    await queryBeforeMessage(messageId, before);
    await queryAfterMessage(messageId, after);
  };

  /**
   * Makes a query to load messages before particular message id.
   *
   * @param messageId Targeted message id
   * @param limit Number of messages to load
   */
  const queryBeforeMessage = async (messageId: string, limit = 20) => {
    if (!channel) return;

    await channel.query({
      messages: {
        id_lt: messageId,
        limit,
      },
      watch: true,
    });

    channel.state.setIsUptoDate(false);
  };

  /**
   * Makes a query to load messages later than particular message id.
   *
   * @param messageId Targeted message id
   * @param limit Number of messages to load.
   */
  const queryAfterMessage = async (messageId: string, limit = 20) => {
    if (!channel) return;
    const state = await channel.query({
      messages: {
        id_gte: messageId,
        limit,
      },
      watch: true,
    });

    if (state.messages.length < limit) {
      channel.state.setIsUptoDate(true);
    } else {
      channel.state.setIsUptoDate(false);
    }
  };

  /**
   * MESSAGE METHODS
   */

  const actionProps = {
    reactionsEnabled: true,
    repliesEnabled: true,
  } as ActionProps;
  if (typeof channel?.getConfig === 'function') {
    const reactions = channel.getConfig()?.reactions;
    const replies = channel.getConfig()?.replies;
    actionProps.reactionsEnabled = reactions;
    actionProps.repliesEnabled = replies;
  }

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
      channel.state.addMessageSorted(updatedMessage, true);
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
    mentioned_users,
    parent_id,
    text,
    ...extraFields
  }: Partial<StreamMessage<At, Me, Us>>) =>
    (({
      __html: text,
      attachments,
      created_at: new Date(),
      html: text,
      id: `${client.userID}-${generateRandomId()}`,
      mentioned_users:
        mentioned_users?.map((userId) => ({
          id: userId,
        })) || [],
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
    } as unknown) as MessageResponse<At, Ch, Co, Me, Re, Us>);

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
      mentioned_users:
        mentioned_users?.map((mentionedUser) => mentionedUser.id) || [],
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

  const sendMessage: InputMessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['sendMessage'] = async (message) => {
    if (channel?.state?.filterErrorMessages) {
      channel.state.filterErrorMessages();
    }

    const messagePreview = createMessagePreview({
      ...message,
      attachments: message.attachments || [],
    });

    if (!channel?.state.isUpToDate) {
      await reloadChannel();
    }

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

  const loadMoreRecentFinished = (
    newMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'],
  ) => {
    setLoadingMoreRecent(false);
    setMessages(newMessages);
  };

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreRecentFinishedDebounced = debounce(
    loadMoreRecentFinished,
    2000,
    {
      leading: true,
      trailing: true,
    },
  );

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
    const limit = 20;

    try {
      if (channel) {
        const queryResponse = await channel.query({
          messages: { id_lt: oldestID, limit },
        });

        const updatedHasMore = queryResponse.messages.length === limit;
        loadMoreFinishedDebounced(updatedHasMore, channel.state.messages);
      }
    } catch (err) {
      console.warn('Message pagination request failed with error', err);
      return setLoadingMore(false);
    }
  };

  const loadMoreRecent = async () => {
    if (loadingMoreRecent || channel?.state.isUpToDate) {
      return;
    }
    setLoadingMoreRecent(true);

    if (!messages.length) {
      return setLoadingMoreRecent(false);
    }

    const recentMessage = messages && messages[messages.length - 1];

    if (recentMessage && recentMessage.status !== 'received') {
      return setLoadingMoreRecent(false);
    }

    const recentId = recentMessage && recentMessage.id;
    try {
      if (channel) {
        await queryAfterMessage(recentId, 20);

        loadMoreRecentFinishedDebounced(channel.state.messages);
      }
    } catch (err) {
      console.warn('Message pagination request failed with error', err);
      return setLoadingMoreRecent(false);
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
  const loadMoreRecentThrottled: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['loadMoreRecent'] = throttle(loadMoreRecent, 2000, {
    leading: true,
    trailing: true,
  });

  const editMessage: InputMessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['editMessage'] = (updatedMessage) =>
    doUpdateMessageRequest
      ? doUpdateMessageRequest(channel?.cid || '', updatedMessage)
      : client.updateMessage(updatedMessage);

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

  const setReplyToState: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['setReplyToState'] = (message) => {
    setReplyTo(message);
  };

  const clearEditingState: InputMessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['clearEditingState'] = () => setEditing(false);

  const clearReplyToState: InputMessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['clearReplyToState'] = () => setReplyTo(false);

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
      ? channel?.state?.threads[message.id] || Immutable([])
      : Immutable([]);
    setThread(message);
    setThreadMessages(newThreadMessages);
  };

  const closeThread: ThreadContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['closeThread'] = useCallback(() => {
    setThread(null);
    setThreadMessages(Immutable([]));
  }, [setThread, setThreadMessages]);

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
    if (threadLoadingMore || !thread?.id) return;
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

  const channelContext = useCreateChannelContext({
    channel,
    disabled: !!channel?.data?.frozen && disableIfFrozenChannel,
    EmptyStateIndicator,
    enforceUniqueReaction,
    error,
    giphyEnabled:
      giphyEnabled ??
      !!(channel?.getConfig?.()?.commands || [])?.some(
        (command) => command.name === 'giphy',
      ),
    initialScrollToFirstUnreadMessage,
    isAdmin,
    isModerator,
    isOwner,
    lastRead,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    markRead: markReadThrottled,
    members,
    read,
    reloadChannel,
    setLastRead,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    typing,
    watcherCount,
    watchers,
  });

  const messageInputContext = useCreateInputMessageInputContext({
    additionalTextInputProps,
    AttachButton,
    clearEditingState,
    clearReplyToState,
    CommandsButton,
    compressImageQuality,
    doDocUploadRequest,
    doImageUploadRequest,
    editing,
    editMessage,
    FileUploadPreview,
    hasFilePicker,
    hasImagePicker,
    ImageUploadPreview,
    initialValue,
    Input,
    maxNumberOfFiles,
    MoreOptionsButton,
    numberOfLines,
    onChangeText,
    replyTo,
    SendButton,
    sendImageAsync,
    sendMessage,
    setInputRef,
    ShowThreadMessageInChannelButton,
    UploadProgressIndicator,
  });

  const messagesContext = useCreateMessagesContext({
    ...actionProps,
    additionalTouchableProps,
    Attachment,
    AttachmentActions,
    AttachmentFileIcon,
    Card,
    CardCover,
    CardFooter,
    CardHeader,
    DateHeader,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch,
    FileAttachment,
    FileAttachmentGroup,
    FlatList,
    formatDate,
    Gallery,
    Giphy,
    hasMore,
    InlineUnreadIndicator,
    loadingMore,
    loadingMoreRecent,
    loadMore: loadMoreThrottled,
    loadMoreRecent: loadMoreRecentThrottled,
    markdownRules,
    Message,
    MessageAvatar,
    MessageContent,
    messageContentOrder,
    MessageFooter,
    MessageHeader,
    MessageList,
    MessageNotification,
    MessageReplies,
    messages,
    MessageSimple,
    MessageStatus,
    MessageSystem,
    MessageText,
    ReactionList,
    removeMessage,
    Reply,
    retrySendMessage,
    setEditingState,
    setReplyToState,
    supportedReactions,
    TypingIndicator,
    TypingIndicatorContainer,
    updateMessage,
    UrlPreview,
  });

  const suggestionsContext: Partial<SuggestionsContextValue<Co, Us>> = {
    closeSuggestions,
    openSuggestions,
    updateSuggestions,
  };

  const threadContext = useCreateThreadContext({
    allowThreadMessagesInChannel,
    closeThread,
    loadMoreThread,
    openThread,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages,
  });

  if (!channel || error) {
    return (
      <LoadingErrorIndicator
        error={error}
        listType='message'
        retry={() => {
          loadMoreThrottled();
        }}
      />
    );
  }

  if (!channel?.cid || !channel.watch) {
    return (
      <Text style={[styles.selectChannel, selectChannel]} testID='no-channel'>
        {t('Please select a channel first')}
      </Text>
    );
  }

  return (
    <KeyboardCompatibleView
      behavior={keyboardBehavior}
      enabled={!disableKeyboardCompatibleView}
      keyboardVerticalOffset={keyboardVerticalOffset}
      {...additionalKeyboardAvoidingViewProps}
    >
      <ChannelProvider<At, Ch, Co, Ev, Me, Re, Us> value={channelContext}>
        <MessagesProvider<At, Ch, Co, Ev, Me, Re, Us> value={messagesContext}>
          <ThreadProvider<At, Ch, Co, Ev, Me, Re, Us> value={threadContext}>
            <SuggestionsProvider<Co, Us> value={suggestionsContext}>
              <MessageInputProvider<At, Ch, Co, Ev, Me, Re, Us>
                value={messageInputContext}
              >
                <View style={{ height: '100%' }}>{children}</View>
              </MessageInputProvider>
            </SuggestionsProvider>
          </ThreadProvider>
        </MessagesProvider>
      </ChannelProvider>
    </KeyboardCompatibleView>
  );
};

// const areEqual = <
//   At extends UnknownType = DefaultAttachmentType,
//   Ch extends UnknownType = DefaultChannelType,
//   Co extends string = DefaultCommandType,
//   Ev extends UnknownType = DefaultEventType,
//   Me extends UnknownType = DefaultMessageType,
//   Re extends UnknownType = DefaultReactionType,
//   Us extends UnknownType = DefaultUserType
// >(
//   prevProps: ChannelPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
//   nextProps: ChannelPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
// ) => {
//   const { channel: prevChannel, t: prevT } = prevProps;
//   const { channel: nextChannel, t: nextT } = nextProps;

//   const tEqual = prevT === nextT;
//   if (!tEqual) return false;

//   const channelEqual =
//     (!!prevChannel &&
//       !!nextChannel &&
//       prevChannel.data?.name === nextChannel.data?.name) ||
//     prevChannel === nextChannel;
//   if (!channelEqual) return false;

//   return true;
// };

// const MemoizedChannel = React.memo(
//   ChannelWithContext,
//   areEqual,
// ) as typeof ChannelWithContext;

export type ChannelProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<ChannelPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList, Thread, and MessageInput must be
 * children of the Channel component to receive the ChannelContext.
 *
 * @example ./Channel.md
 */
export const Channel = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: PropsWithChildren<ChannelProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  return (
    <ChannelWithContext<At, Ch, Co, Ev, Me, Re, Us>
      {...{
        client,
        t,
      }}
      {...props}
    />
  );
};

Channel.displayName = 'Channel{channel}';
