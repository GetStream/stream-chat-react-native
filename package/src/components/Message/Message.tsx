import React from 'react';
import { GestureResponderEvent, Keyboard, StyleProp, View, ViewStyle } from 'react-native';

import type { Attachment } from 'stream-chat';

import { useCreateMessageContext } from './hooks/useCreateMessageContext';
import { useMessageActionHandlers } from './hooks/useMessageActionHandlers';
import { useMessageActions } from './hooks/useMessageActions';
import { messageActions as defaultMessageActions } from './utils/messageActions';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  KeyboardContextValue,
  useKeyboardContext,
} from '../../contexts/keyboardContext/KeyboardContext';
import {
  MessageContextValue,
  MessageProvider,
  Reactions,
} from '../../contexts/messageContext/MessageContext';
import {
  MessageOverlayContextValue,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { triggerHaptic } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { emojiRegex, MessageStatusTypes } from '../../utils/utils';

import {
  isMessageWithStylesReadByAndDateSeparator,
  MessageType,
} from '../MessageList/hooks/useMessageList';
import type { MessageActionListItemProps } from '../MessageOverlay/MessageActionListItem';

export type TouchableHandlerPayload = {
  defaultHandler?: () => void;
  emitter?:
    | 'card'
    | 'fileAttachment'
    | 'gallery'
    | 'giphy'
    | 'message'
    | 'messageContent'
    | 'messageReplies'
    | 'reactionList'
    | 'textLink'
    | 'textMention';
  event?: GestureResponderEvent;
};

export type MessageTouchableHandlerPayload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = TouchableHandlerPayload & {
  actionHandlers?: MessageActionHandlers;
  message?: MessageType<StreamChatGenerics>;
};

export type MessageActionHandlers = {
  deleteMessage: () => Promise<void>;
  editMessage: () => void;
  pinMessage: () => Promise<void>;
  quotedReply: () => void;
  resendMessage: () => Promise<void>;
  showMessageOverlay: () => void;
  toggleBanUser: () => Promise<void>;
  toggleMuteUser: () => Promise<void>;
  toggleReaction: (reactionType: string) => Promise<void>;
};

export type MessagePropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  ChannelContextValue<StreamChatGenerics>,
  'channel' | 'disabled' | 'enforceUniqueReaction' | 'members'
> &
  Pick<ChatContextValue<StreamChatGenerics>, 'client' | 'mutedUsers'> &
  Pick<KeyboardContextValue, 'dismissKeyboard'> &
  Partial<Omit<MessageContextValue<StreamChatGenerics>, 'groupStyles' | 'message'>> &
  Pick<MessageContextValue<StreamChatGenerics>, 'groupStyles' | 'message'> &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'dismissKeyboardOnMessageTouch'
    | 'forceAlignMessages'
    | 'handleBlock'
    | 'handleCopy'
    | 'handleDelete'
    | 'handleEdit'
    | 'handleFlag'
    | 'handleMute'
    | 'handlePinMessage'
    | 'handleQuotedReply'
    | 'handleReaction'
    | 'handleRetry'
    | 'handleThreadReply'
    | 'isAttachmentEqual'
    | 'messageActions'
    | 'messageContentOrder'
    | 'MessageSimple'
    | 'onLongPressMessage'
    | 'onPressInMessage'
    | 'onPressMessage'
    | 'OverlayReactionList'
    | 'removeMessage'
    | 'retrySendMessage'
    | 'selectReaction'
    | 'setEditingState'
    | 'setQuotedMessageState'
    | 'supportedReactions'
    | 'updateMessage'
  > &
  Pick<MessageOverlayContextValue<StreamChatGenerics>, 'setData'> &
  Pick<OverlayContextValue, 'setOverlay'> &
  Pick<ThreadContextValue<StreamChatGenerics>, 'openThread'> &
  Pick<TranslationContextValue, 't'> & {
    messagesContext: MessagesContextValue<StreamChatGenerics>;
    /**
     * Whether or not users are able to long press messages.
     */
    enableLongPress?: boolean;
    goToMessage?: (messageId: string) => void;
    isTargetedMessage?: boolean;
    /**
     * Array of allowed actions or null on message, this can also be a function returning the array.
     * If all the actions need to be disabled an empty array should be provided as value of prop
     */
    /**
     * You can call methods available on the Message
     * component such as handleEdit, handleDelete, handleAction etc.
     *
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/Message/Message.tsx)
     *
     * By default, we show the overlay with all the message actions on long press.
     *
     * @param message Message object which was long pressed
     * @param event   Event object for onLongPress event
     **/
    onLongPress?: (payload: Partial<MessageTouchableHandlerPayload<StreamChatGenerics>>) => void;

    /**
     * You can call methods available on the Message
     * component such as handleEdit, handleDelete, handleAction etc.
     *
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/Message/Message.tsx)
     *
     * By default, we will dismiss the keyboard on press.
     *
     * @param message Message object which was long pressed
     * @param event   Event object for onLongPress event
     * */
    onPress?: (payload: Partial<MessageTouchableHandlerPayload<StreamChatGenerics>>) => void;
    onPressIn?: (payload: Partial<MessageTouchableHandlerPayload<StreamChatGenerics>>) => void;
    /**
     * Handler to open the thread on message. This is callback for touch event for replies button.
     *
     * @param message A message object to open the thread upon.
     */
    onThreadSelect?: (message: MessageType<StreamChatGenerics>) => void;
    showUnreadUnderlay?: boolean;
    style?: StyleProp<ViewStyle>;
  };

/**
 * Since this component doesn't consume `messages` from `MessagesContext`,
 * we memoized and broke it up to prevent new messages from re-rendering
 * each individual Message component.
 */
const MessageWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessagePropsWithContext<StreamChatGenerics>,
) => {
  const isMessageTypeDeleted = props.message.type === 'deleted';

  const {
    channel,
    client,
    disabled,
    dismissKeyboard,
    dismissKeyboardOnMessageTouch,
    enableLongPress = true,
    enforceUniqueReaction,
    forceAlignMessages = false,
    goToMessage,
    groupStyles = ['bottom'],
    handleBlock,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction: handleReactionProp,
    handleRetry,
    handleThreadReply,
    lastReceivedId,
    members,
    message,
    messageActions: messageActionsProp = defaultMessageActions,
    messageContentOrder: messageContentOrderProp,
    messagesContext,
    MessageSimple,
    onLongPress: onLongPressProp,
    onLongPressMessage: onLongPressMessageProp,
    onPress: onPressProp,
    onPressMessage: onPressMessageProp,
    onPressIn: onPressInProp,
    onPressInMessage: onPressInMessageProp,
    onThreadSelect,
    openThread,
    OverlayReactionList,
    preventPress,
    removeMessage,
    retrySendMessage,
    selectReaction,
    setData,
    setEditingState,
    setOverlay,
    setQuotedMessageState,
    showAvatar,
    showMessageStatus,
    showUnreadUnderlay,
    style,
    supportedReactions,
    t,
    isTargetedMessage,
    threadList = false,
    updateMessage,
  } = props;

  const {
    theme: {
      colors: { bg_gradient_start, targetedMessageBackground },
      messageSimple: { targetedMessageUnderlay },
    },
  } = useTheme();

  const actionsEnabled =
    message.type === 'regular' && message.status === MessageStatusTypes.RECEIVED;

  const isMyMessage = client && message && client.userID === message.user?.id;

  const handleAction = async (name: string, value: string) => {
    if (message.id) {
      const data = await channel?.sendAction(message.id, { [name]: value });
      if (data?.message) {
        updateMessage(data.message);
      } else {
        removeMessage({
          id: message.id,
          parent_id: message.parent_id,
        });
      }
    }
  };

  const onPressQuotedMessage = (quotedMessage: MessageType<StreamChatGenerics>) => {
    if (!goToMessage) return;

    goToMessage(quotedMessage.id);
  };

  const errorOrFailed = message.type === 'error' || message.status === MessageStatusTypes.FAILED;

  const onPress = (error = errorOrFailed) => {
    if (dismissKeyboardOnMessageTouch) {
      Keyboard.dismiss();
    }
    const quotedMessage = message.quoted_message as MessageType<StreamChatGenerics>;
    if (error) {
      showMessageOverlay(false, true);
    } else if (quotedMessage) {
      onPressQuotedMessage(quotedMessage);
    }
  };

  const alignment =
    forceAlignMessages && (forceAlignMessages === 'left' || forceAlignMessages === 'right')
      ? forceAlignMessages
      : isMyMessage
      ? 'right'
      : 'left';

  /**
   * attachments contain files/images or other attachments
   *
   * if a URL attachment is present with a file/image then we
   * show just the text and markdown should make the link
   * clickable
   */
  const attachments =
    !isMessageTypeDeleted && Array.isArray(message.attachments)
      ? message.attachments.reduce(
          (acc, cur) => {
            if (cur.type === 'file' || cur.type === 'video') {
              acc.files.push(cur);
              acc.other = []; // remove other attachments if a file exists
            } else if (cur.type === 'image' && !cur.title_link && !cur.og_scrape_url) {
              /**
               * this next if is not combined with the above one for cases where we have
               * an image with no url links at all falling back to being an attachment
               */
              if (cur.image_url || cur.thumb_url) {
                acc.images.push(cur);
                acc.other = []; // remove other attachments if an image exists
              }
              // only add other attachments if there are no files/images
            } else if (!acc.files.length && !acc.images.length) {
              acc.other.push(cur);
            }

            return acc;
          },
          {
            files: [] as Attachment<StreamChatGenerics>[],
            images: [] as Attachment<StreamChatGenerics>[],
            other: [] as Attachment<StreamChatGenerics>[],
          },
        )
      : {
          files: [] as Attachment<StreamChatGenerics>[],
          images: [] as Attachment<StreamChatGenerics>[],
          other: [] as Attachment<StreamChatGenerics>[],
        };

  /**
   * Check if any actions to prevent long press
   */
  const hasAttachmentActions =
    !isMessageTypeDeleted &&
    Array.isArray(message.attachments) &&
    message.attachments.some((attachment) => attachment.actions && attachment.actions.length);

  const messageContentOrder = messageContentOrderProp.filter((content) => {
    if (content === 'quoted_reply') {
      return !!message.quoted_message;
    }

    switch (content) {
      case 'attachments':
        return !!attachments.other.length;
      case 'files':
        return !!attachments.files.length;
      case 'gallery':
        return !!attachments.images.length;
      case 'text':
      default:
        return !!message.text;
    }
  });

  const onlyEmojis =
    !attachments.files.length &&
    !attachments.images.length &&
    !attachments.other.length &&
    !!message.text &&
    emojiRegex.test(message.text);

  const onOpenThread = () => {
    if (onThreadSelect) {
      onThreadSelect(message);
    }
    if (openThread) {
      openThread(message);
    }
  };

  const hasReactions =
    !isMessageTypeDeleted && !!message.latest_reactions && message.latest_reactions.length > 0;

  const clientId = client.userID;

  const reactions = hasReactions
    ? supportedReactions.reduce((acc, cur) => {
        const reactionType = cur.type;
        const reactionsOfReactionType = message.latest_reactions?.filter(
          (reaction) => reaction.type === reactionType,
        );

        if (reactionsOfReactionType?.length) {
          const hasOwnReaction = reactionsOfReactionType.some(
            (reaction) => reaction.user_id === clientId,
          );
          acc.push({ own: hasOwnReaction, type: reactionType });
        }

        return acc;
      }, [] as Reactions)
    : [];

  const ownCapabilities = useOwnCapabilitiesContext();

  const {
    handleDeleteMessage,
    handleEditMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleTogglePinMessage,
    handleToggleReaction,
  } = useMessageActionHandlers({
    channel,
    client,
    enforceUniqueReaction,
    message,
    removeMessage,
    retrySendMessage,
    setEditingState,
    setQuotedMessageState,
    supportedReactions,
    updateMessage,
  });

  const {
    blockUser,
    copyMessage,
    deleteMessage,
    editMessage,
    flagMessage,
    handleReaction,
    muteUser,
    pinMessage,
    quotedReply,
    retry,
    threadReply,
    unpinMessage,
  } = useMessageActions({
    channel,
    client,
    enforceUniqueReaction,
    handleBlock,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction: handleReactionProp,
    handleRetry,
    handleThreadReply,
    message,
    onThreadSelect,
    openThread,
    removeMessage,
    retrySendMessage,
    selectReaction,
    setEditingState,
    setOverlay,
    setQuotedMessageState,
    supportedReactions,
    t,
    updateMessage,
  });

  const showMessageOverlay = async (messageReactions = false, error = errorOrFailed) => {
    await dismissKeyboard();

    const isThreadMessage = threadList || !!message.parent_id;

    const dismissOverlay = () => setOverlay('none');

    const messageActions =
      typeof messageActionsProp !== 'function'
        ? messageActionsProp
        : messageActionsProp({
            blockUser,
            copyMessage,
            deleteMessage,
            dismissOverlay,
            editMessage,
            error,
            flagMessage,
            isMyMessage,
            isThreadMessage,
            message,
            messageReactions,
            muteUser,
            ownCapabilities,
            pinMessage,
            quotedReply,
            retry,
            threadReply,
            unpinMessage,
          });

    setData({
      alignment,
      clientId: client.userID,
      files: attachments.files,
      groupStyles,
      handleReaction: ownCapabilities.sendReaction ? handleReaction : undefined,
      images: attachments.images,
      message,
      messageActions: messageActions?.filter(Boolean) as MessageActionListItemProps[] | undefined,
      messageContext: { ...messageContext, disabled: true, preventPress: true },
      messageReactionTitle: !error && messageReactions ? t('Message Reactions') : undefined,
      messagesContext: { ...messagesContext, messageContentOrder },
      onlyEmojis,
      otherAttachments: attachments.other,
      OverlayReactionList,
      ownCapabilities,
      supportedReactions,
      threadList,
    });

    setOverlay('message');
  };

  const actionHandlers: MessageActionHandlers = {
    deleteMessage: handleDeleteMessage,
    editMessage: handleEditMessage,
    pinMessage: handleTogglePinMessage,
    quotedReply: handleQuotedReplyMessage,
    resendMessage: handleResendMessage,
    showMessageOverlay,
    toggleBanUser: handleToggleBanUser,
    toggleMuteUser: handleToggleMuteUser,
    toggleReaction: handleToggleReaction,
  };

  const onLongPressMessage =
    disabled || hasAttachmentActions
      ? () => null
      : onLongPressMessageProp
      ? (payload?: TouchableHandlerPayload) =>
          onLongPressMessageProp({
            actionHandlers,
            defaultHandler: payload?.defaultHandler || showMessageOverlay,
            emitter: payload?.emitter || 'message',
            event: payload?.event,
            message,
          })
      : onLongPressProp
      ? (payload?: TouchableHandlerPayload) =>
          onLongPressProp({
            actionHandlers,
            defaultHandler: payload?.defaultHandler || showMessageOverlay,
            emitter: payload?.emitter || 'message',
            event: payload?.event,
          })
      : enableLongPress
      ? () => {
          triggerHaptic('impactMedium');
          showMessageOverlay(false);
        }
      : () => null;

  const messageContext = useCreateMessageContext({
    actionsEnabled,
    alignment,
    channel,
    disabled,
    files: attachments.files,
    goToMessage,
    groupStyles,
    handleAction,
    handleDeleteMessage,
    handleEditMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleToggleReaction,
    hasReactions,
    images: attachments.images,
    isMyMessage,
    lastGroupMessage: groupStyles?.[0] === 'single' || groupStyles?.[0] === 'bottom',
    lastReceivedId,
    members,
    message,
    messageContentOrder,
    onLongPress: onLongPressMessage,
    onlyEmojis,
    onOpenThread,
    onPress: (payload) => {
      onPressProp
        ? onPressProp({
            actionHandlers,
            defaultHandler: payload.defaultHandler || onPress,
            emitter: payload.emitter || 'message',
            event: payload.event,
            message,
          })
        : onPressMessageProp
        ? onPressMessageProp({
            actionHandlers,
            defaultHandler: payload.defaultHandler || onPress,
            emitter: payload.emitter || 'message',
            event: payload.event,
            message,
          })
        : payload.defaultHandler
        ? payload.defaultHandler()
        : onPress();
    },
    onPressIn:
      onPressInProp || onPressInMessageProp
        ? (payload) => {
            onPressInProp
              ? onPressInProp({
                  actionHandlers,
                  defaultHandler: payload.defaultHandler,
                  emitter: payload.emitter || 'message',
                  event: payload.event,
                  message,
                })
              : onPressInMessageProp &&
                onPressInMessageProp({
                  actionHandlers,
                  defaultHandler: payload.defaultHandler,
                  emitter: payload.emitter || 'message',
                  event: payload.event,
                  message,
                });
          }
        : null,
    otherAttachments: attachments.other,
    preventPress,
    reactions,
    showAvatar,
    showMessageOverlay,
    showMessageStatus: typeof showMessageStatus === 'boolean' ? showMessageStatus : isMyMessage,
    threadList,
  });

  if (!(isMessageTypeDeleted || messageContentOrder.length)) return null;

  return (
    <View
      style={[message.pinned && { backgroundColor: targetedMessageBackground }]}
      testID='message-wrapper'
    >
      <View
        style={[
          style,
          {
            backgroundColor: showUnreadUnderlay ? bg_gradient_start : undefined,
          },
        ]}
      >
        <View
          style={[
            isTargetedMessage
              ? { backgroundColor: targetedMessageBackground, ...targetedMessageUnderlay }
              : {},
          ]}
        >
          <MessageProvider value={messageContext}>
            <MessageSimple />
          </MessageProvider>
        </View>
      </View>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessagePropsWithContext<StreamChatGenerics>,
  nextProps: MessagePropsWithContext<StreamChatGenerics>,
) => {
  const {
    goToMessage: prevGoToMessage,
    isAttachmentEqual,
    isTargetedMessage: prevIsTargetedMessage,
    lastReceivedId: prevLastReceivedId,
    members: prevMembers,
    message: prevMessage,
    mutedUsers: prevMutedUsers,
    showUnreadUnderlay: prevShowUnreadUnderlay,
    t: prevT,
  } = prevProps;
  const {
    goToMessage: nextGoToMessage,
    isTargetedMessage: nextIsTargetedMessage,
    lastReceivedId: nextLastReceivedId,
    members: nextMembers,
    message: nextMessage,
    mutedUsers: nextMutedUsers,
    showUnreadUnderlay: nextShowUnreadUnderlay,
    t: nextT,
  } = nextProps;

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) return false;

  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!repliesEqual) return false;

  const lastReceivedIdChangedAndMatters =
    prevLastReceivedId !== nextLastReceivedId &&
    (prevLastReceivedId === prevMessage.id ||
      prevLastReceivedId === nextMessage.id ||
      nextLastReceivedId === prevMessage.id ||
      nextLastReceivedId === nextMessage.id);

  if (lastReceivedIdChangedAndMatters) return false;

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;

  if (goToMessageChangedAndMatters) return false;

  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    (isMessageWithStylesReadByAndDateSeparator(prevMessage) && prevMessage.readBy) ===
      (isMessageWithStylesReadByAndDateSeparator(nextMessage) && nextMessage.readBy) &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned &&
    prevMessage.updated_at === nextMessage.updated_at;

  if (!messageEqual) return false;

  const isPrevQuotedMessageTypeDeleted = prevMessage.quoted_message?.type === 'deleted';
  const isNextQuotedMessageTypeDeleted = nextMessage.quoted_message?.type === 'deleted';

  const quotedMessageEqual =
    prevMessage.quoted_message?.id === nextMessage.quoted_message?.id &&
    isPrevQuotedMessageTypeDeleted === isNextQuotedMessageTypeDeleted;

  if (!quotedMessageEqual) return false;

  const messageUserBannedEqual = prevMessage.user?.banned === nextMessage.user?.banned;
  if (!messageUserBannedEqual) return false;

  const prevMessageAttachments = prevMessage.attachments;
  const nextMessageAttachments = nextMessage.attachments;
  const attachmentsEqual =
    (Array.isArray(prevMessageAttachments) &&
      Array.isArray(nextMessageAttachments) &&
      prevMessageAttachments.length === nextMessageAttachments.length &&
      prevMessageAttachments.every((attachment, index) => {
        const attachmentKeysEqual =
          attachment.type === 'image'
            ? attachment.image_url === nextMessageAttachments[index].image_url &&
              attachment.thumb_url === nextMessageAttachments[index].thumb_url
            : attachment.type === nextMessageAttachments[index].type;

        if (isAttachmentEqual)
          return (
            attachmentKeysEqual && !!isAttachmentEqual(attachment, nextMessageAttachments[index])
          );

        return attachmentKeysEqual;
      })) ||
    prevMessageAttachments === nextMessageAttachments;
  if (!attachmentsEqual) return false;

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) && Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length === nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) => type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) return false;

  const mutedUserSame =
    prevMutedUsers.length === nextMutedUsers.length ||
    prevMutedUsers.some((mutedUser) => mutedUser.target.id === prevMessage.user?.id) ===
      nextMutedUsers.some((mutedUser) => mutedUser.target.id === nextMessage.user?.id);
  if (!mutedUserSame) return false;

  const showUnreadUnderlayEqual = prevShowUnreadUnderlay === nextShowUnreadUnderlay;
  if (!showUnreadUnderlayEqual) return false;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const targetedMessageEqual = prevIsTargetedMessage === nextIsTargetedMessage;
  if (!targetedMessageEqual) return false;

  return true;
};

const MemoizedMessage = React.memo(MessageWithContext, areEqual) as typeof MessageWithContext;

export type MessageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<MessagePropsWithContext<StreamChatGenerics>, 'groupStyles' | 'message'>> &
  Pick<MessagePropsWithContext<StreamChatGenerics>, 'groupStyles' | 'message'>;

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./Message.md
 */
export const Message = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageProps<StreamChatGenerics>,
) => {
  const { channel, disabled, enforceUniqueReaction, members } =
    useChannelContext<StreamChatGenerics>();
  const { client, mutedUsers } = useChatContext<StreamChatGenerics>();
  const { dismissKeyboard } = useKeyboardContext();
  const { setData } = useMessageOverlayContext<StreamChatGenerics>();
  const messagesContext = useMessagesContext<StreamChatGenerics>();
  const { setOverlay } = useOverlayContext();
  const { openThread } = useThreadContext<StreamChatGenerics>();
  const { t } = useTranslationContext();

  return (
    <MemoizedMessage<StreamChatGenerics>
      {...messagesContext}
      {...{
        channel,
        client,
        disabled,
        dismissKeyboard,
        enforceUniqueReaction,
        members,
        messagesContext,
        mutedUsers,
        openThread,
        setData,
        setOverlay,
        t,
      }}
      {...props}
    />
  );
};
