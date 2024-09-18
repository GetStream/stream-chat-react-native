import React, { useMemo, useState } from 'react';
import { GestureResponderEvent, Keyboard, StyleProp, View, ViewStyle } from 'react-native';

import type { Attachment, UserResponse } from 'stream-chat';

import { useCreateMessageContext } from './hooks/useCreateMessageContext';
import { useMessageActionHandlers } from './hooks/useMessageActionHandlers';
import { useMessageActions } from './hooks/useMessageActions';
import { useProcessReactions } from './hooks/useProcessReactions';
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
import { MessageContextValue, MessageProvider } from '../../contexts/messageContext/MessageContext';
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

import { isVideoPackageAvailable, triggerHaptic } from '../../native';
import { DefaultStreamChatGenerics, FileTypes } from '../../types/types';
import {
  hasOnlyEmojis,
  isBlockedMessage,
  isBouncedMessage,
  isEditedMessage,
  MessageStatusTypes,
} from '../../utils/utils';

import {
  isMessageWithStylesReadByAndDateSeparator,
  MessageType,
} from '../MessageList/hooks/useMessageList';
import type { MessageActionListItemProps } from '../MessageOverlay/MessageActionListItem';

export type TouchableEmitter =
  | 'fileAttachment'
  | 'gallery'
  | 'giphy'
  | 'message'
  | 'messageContent'
  | 'messageReplies'
  | 'reactionList';

export type TextMentionTouchableHandlerPayload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  emitter: 'textMention';
  additionalInfo?: { user?: UserResponse<StreamChatGenerics> };
};

export type UrlTouchableHandlerPayload = {
  emitter: 'textLink' | 'card';
  additionalInfo?: { url?: string };
};

export type FileAttachmentTouchableHandlerPayload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  emitter: 'fileAttachment';
  additionalInfo?: { attachment?: Attachment<StreamChatGenerics> };
};

export type TouchableHandlerPayload = {
  defaultHandler?: () => void;
  event?: GestureResponderEvent;
} & (
  | {
      emitter?: Exclude<TouchableEmitter, 'textMention' | 'textLink' | 'card' | 'fileAttachment'>;
    }
  | TextMentionTouchableHandlerPayload
  | UrlTouchableHandlerPayload
  | FileAttachmentTouchableHandlerPayload
);

export type MessageTouchableHandlerPayload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = TouchableHandlerPayload & {
  /**
   * Set of action handler functions for various message actions. You can use these functions to perform any action when give interaction occurs.
   */
  actionHandlers?: MessageActionHandlers<StreamChatGenerics>;
  /**
   * Additional message touchable handler info.
   */
  additionalInfo?: Record<string, unknown>;
  /**
   * Message object, on which interaction occurred.
   */
  message?: MessageType<StreamChatGenerics>;
};

export type MessageActionHandlers<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  copyMessage: () => void;
  deleteMessage: () => void;
  editMessage: () => void;
  flagMessage: () => void;
  pinMessage: () => Promise<void>;
  quotedReply: () => void;
  resendMessage: () => Promise<void>;
  /**
   * @deprecated
   * TODO: This seems useless for the action handlers here so can be removed.
   */
  showMessageOverlay: () => void;
  toggleBanUser: () => Promise<void>;
  toggleMuteUser: () => Promise<void>;
  toggleReaction: (reactionType: string) => Promise<void>;
  unpinMessage: () => Promise<void>;
  threadReply?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
};

export type MessagePropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'channel' | 'enforceUniqueReaction' | 'members'> &
  Pick<KeyboardContextValue, 'dismissKeyboard'> &
  Partial<Omit<MessageContextValue<StreamChatGenerics>, 'groupStyles' | 'message'>> &
  Pick<MessageContextValue<StreamChatGenerics>, 'groupStyles' | 'message'> &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'sendReaction'
    | 'deleteMessage'
    | 'dismissKeyboardOnMessageTouch'
    | 'forceAlignMessages'
    | 'handleBan'
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
    | 'MessageBounce'
    | 'MessageSimple'
    | 'onLongPressMessage'
    | 'onPressInMessage'
    | 'onPressMessage'
    | 'OverlayReactionList'
    | 'removeMessage'
    | 'deleteReaction'
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
    chatContext: ChatContextValue<StreamChatGenerics>;
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
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/Message.tsx)
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
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/Message.tsx)
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
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const [isEditedMessageOpen, setIsEditedMessageOpen] = useState(false);
  const isMessageTypeDeleted = props.message.type === 'deleted';

  const {
    channel,
    chatContext,
    deleteMessage: deleteMessageFromContext,
    deleteReaction,
    dismissKeyboard,
    dismissKeyboardOnMessageTouch,
    enableLongPress = true,
    enforceUniqueReaction,
    forceAlignMessages = false,
    goToMessage,
    groupStyles = ['bottom'],
    handleBan,
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
    isTargetedMessage,
    lastReceivedId,
    members,
    message,
    messageActions: messageActionsProp = defaultMessageActions,
    MessageBounce,
    messageContentOrder: messageContentOrderProp,
    messagesContext,
    MessageSimple,
    onLongPress: onLongPressProp,
    onLongPressMessage: onLongPressMessageProp,
    onPress: onPressProp,
    onPressIn: onPressInProp,
    onPressInMessage: onPressInMessageProp,
    onPressMessage: onPressMessageProp,
    onThreadSelect,
    openThread,
    OverlayReactionList,
    preventPress,
    removeMessage,
    retrySendMessage,
    selectReaction,
    sendReaction,
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
    threadList = false,
    updateMessage,
  } = props;
  const { client } = chatContext;
  const {
    theme: {
      colors: { bg_gradient_start, targetedMessageBackground },
      messageSimple: { targetedMessageContainer, targetedMessageUnderlay },
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
    if (isEditedMessage(message)) {
      setIsEditedMessageOpen((prevState) => !prevState);
    }
    const quotedMessage = message.quoted_message as MessageType<StreamChatGenerics>;
    if (error) {
      /**
       * If its a Blocked message, we don't do anything as per specs.
       */
      if (isBlockedMessage(message)) {
        return;
      }
      /**
       * If its a Bounced message, we open the message bounced options modal.
       */
      if (isBouncedMessage(message)) {
        setIsBounceDialogOpen(true);
        return;
      }
      showMessageOverlay(true, true);
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
            if (cur.type === FileTypes.File) {
              acc.files.push(cur);
              acc.other = []; // remove other attachments if a file exists
            } else if (
              cur.type === FileTypes.Video &&
              !cur.og_scrape_url &&
              isVideoPackageAvailable()
            ) {
              acc.videos.push({
                image_url: cur.asset_url,
                thumb_url: cur.thumb_url,
                type: FileTypes.Video,
              });
              acc.other = [];
            } else if (cur.type === FileTypes.Video && !cur.og_scrape_url) {
              acc.files.push(cur);
              acc.other = []; // remove other attachments if a file exists
            } else if (cur.type === FileTypes.Audio || cur.type === FileTypes.VoiceRecording) {
              acc.files.push(cur);
            } else if (cur.type === FileTypes.Image && !cur.title_link && !cur.og_scrape_url) {
              /**
               * this next if is not combined with the above one for cases where we have
               * an image with no url links at all falling back to being an attachment
               */
              if (cur.image_url || cur.thumb_url) {
                acc.images.push(cur);
                acc.other = []; // remove other attachments if an image exists
              }
              // only add other attachments if there are no files/images
            } else if (!acc.files.length && !acc.images.length && !acc.videos.length) {
              acc.other.push(cur);
            }

            return acc;
          },
          {
            files: [] as Attachment<StreamChatGenerics>[],
            images: [] as Attachment<StreamChatGenerics>[],
            other: [] as Attachment<StreamChatGenerics>[],
            videos: [] as Attachment<StreamChatGenerics>[],
          },
        )
      : {
          files: [] as Attachment<StreamChatGenerics>[],
          images: [] as Attachment<StreamChatGenerics>[],
          other: [] as Attachment<StreamChatGenerics>[],
          videos: [] as Attachment<StreamChatGenerics>[],
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
        return !!attachments.images.length || !!attachments.videos.length;
      case 'text':
      default:
        return !!message.text;
    }
  });

  const emojiOnlyText = useMemo(() => {
    if (!message.text) return false;
    return hasOnlyEmojis(message.text);
  }, [message.text]);

  const onlyEmojis =
    !attachments.files.length &&
    !attachments.images.length &&
    !attachments.other.length &&
    emojiOnlyText;

  const onOpenThread = () => {
    if (onThreadSelect) {
      onThreadSelect(message);
    }
    if (openThread) {
      openThread(message);
    }
  };

  const { existingReactions, hasReactions } = useProcessReactions({
    latest_reactions: message.latest_reactions,
    own_reactions: message.own_reactions,
    reaction_groups: message.reaction_groups,
  });

  const reactions = hasReactions ? existingReactions : [];

  const ownCapabilities = useOwnCapabilitiesContext();

  const {
    handleCopyMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleFlagMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleTogglePinMessage,
    handleToggleReaction,
  } = useMessageActionHandlers({
    channel,
    client,
    deleteMessage: deleteMessageFromContext,
    deleteReaction,
    enforceUniqueReaction,
    message,
    retrySendMessage,
    sendReaction,
    setEditingState,
    setQuotedMessageState,
    supportedReactions,
  });

  const {
    banUser,
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
    deleteMessage: deleteMessageFromContext,
    deleteReaction,
    enforceUniqueReaction,
    handleBan,
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
    sendReaction,
    setEditingState,
    setOverlay,
    setQuotedMessageState,
    supportedReactions,
    t,
    updateMessage,
  });

  const { userLanguage } = useTranslationContext();

  const showMessageOverlay = async (isMessageActionsVisible = true, error = errorOrFailed) => {
    await dismissKeyboard();

    const isThreadMessage = threadList || !!message.parent_id;

    const dismissOverlay = () => setOverlay('none');

    const messageActions =
      typeof messageActionsProp !== 'function'
        ? messageActionsProp
        : messageActionsProp({
            banUser,
            blockUser,
            copyMessage,
            deleteMessage,
            dismissOverlay,
            editMessage,
            error,
            flagMessage,
            isMessageActionsVisible,
            isMyMessage,
            isThreadMessage,
            message,
            messageReactions: isMessageActionsVisible === false,
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
      chatContext,
      clientId: client.userID,
      files: attachments.files,
      groupStyles,
      handleReaction: ownCapabilities.sendReaction ? handleReaction : undefined,
      images: attachments.images,
      message,
      messageActions: messageActions?.filter(Boolean) as MessageActionListItemProps[] | undefined,
      messageContext: { ...messageContext, preventPress: true },
      messageReactionTitle: !error && !isMessageActionsVisible ? t('Message Reactions') : undefined,
      messagesContext: { ...messagesContext, messageContentOrder },
      onlyEmojis,
      otherAttachments: attachments.other,
      OverlayReactionList,
      ownCapabilities,
      supportedReactions,
      threadList,
      userLanguage,
      videos: attachments.videos,
    });

    setOverlay('message');
  };

  const actionHandlers: MessageActionHandlers<StreamChatGenerics> = {
    copyMessage: handleCopyMessage,
    deleteMessage: handleDeleteMessage,
    editMessage: handleEditMessage,
    flagMessage: handleFlagMessage,
    pinMessage: handleTogglePinMessage,
    quotedReply: handleQuotedReplyMessage,
    resendMessage: handleResendMessage,
    showMessageOverlay,
    threadReply: handleThreadReply,
    toggleBanUser: handleToggleBanUser,
    toggleMuteUser: handleToggleMuteUser,
    toggleReaction: handleToggleReaction,
    unpinMessage: handleTogglePinMessage,
  };

  const onLongPressMessage =
    hasAttachmentActions || isBlockedMessage(message)
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
          // If a message is bounced, on long press the message bounce options modal should open.
          if (isBouncedMessage(message)) {
            setIsBounceDialogOpen(true);
            return;
          }
          triggerHaptic('impactMedium');
          showMessageOverlay(true);
        }
      : () => null;

  const messageContext = useCreateMessageContext({
    actionsEnabled,
    alignment,
    channel,
    files: attachments.files,
    goToMessage,
    groupStyles,
    handleAction,
    handleCopyMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleFlagMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleToggleReaction,
    hasReactions,
    images: attachments.images,
    isEditedMessageOpen,
    isMyMessage,
    lastGroupMessage: groupStyles?.[0] === 'single' || groupStyles?.[0] === 'bottom',
    lastReceivedId,
    members,
    message,
    messageContentOrder,
    myMessageTheme: messagesContext.myMessageTheme,
    onLongPress: onLongPressMessage,
    onlyEmojis,
    onOpenThread,
    onPress: (payload) => {
      const onPressArgs = {
        actionHandlers,
        additionalInfo: payload.additionalInfo,
        defaultHandler: payload.defaultHandler || onPress,
        emitter: payload.emitter || 'message',
        event: payload.event,
        message,
      };

      const handleOnPress = () => {
        if (onPressProp) return onPressProp(onPressArgs);
        if (onPressMessageProp) return onPressMessageProp(onPressArgs);
        if (payload.defaultHandler) return payload.defaultHandler();

        return onPress();
      };

      handleOnPress();
    },
    onPressIn:
      onPressInProp || onPressInMessageProp
        ? (payload) => {
            const onPressInArgs = {
              actionHandlers,
              defaultHandler: payload.defaultHandler,
              emitter: payload.emitter || 'message',
              event: payload.event,
              message,
            };
            const handleOnpressIn = () => {
              if (onPressInProp) return onPressInProp(onPressInArgs);
              if (onPressInMessageProp) return onPressInMessageProp(onPressInArgs);
            };
            handleOnpressIn();
          }
        : null,
    otherAttachments: attachments.other,
    preventPress,
    reactions,
    setIsEditedMessageOpen,
    showAvatar,
    showMessageOverlay,
    showMessageStatus: typeof showMessageStatus === 'boolean' ? showMessageStatus : isMyMessage,
    threadList,
    videos: attachments.videos,
  });

  if (!(isMessageTypeDeleted || messageContentOrder.length)) return null;

  return (
    <View
      style={[
        message.pinned && {
          ...targetedMessageContainer,
          backgroundColor: targetedMessageBackground,
        },
      ]}
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
            {isBounceDialogOpen && <MessageBounce setIsBounceDialogOpen={setIsBounceDialogOpen} />}
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
    chatContext: { mutedUsers: prevMutedUsers },
    goToMessage: prevGoToMessage,
    groupStyles: prevGroupStyles,
    isAttachmentEqual,
    isTargetedMessage: prevIsTargetedMessage,
    lastReceivedId: prevLastReceivedId,
    members: prevMembers,
    message: prevMessage,
    messagesContext: prevMessagesContext,
    showUnreadUnderlay: prevShowUnreadUnderlay,
    t: prevT,
  } = prevProps;
  const {
    chatContext: { mutedUsers: nextMutedUsers },
    goToMessage: nextGoToMessage,
    groupStyles: nextGroupStyles,
    isTargetedMessage: nextIsTargetedMessage,
    lastReceivedId: nextLastReceivedId,
    members: nextMembers,
    message: nextMessage,
    messagesContext: nextMessagesContext,
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

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length && prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) return false;

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
    `${prevMessage?.updated_at}` === `${nextMessage?.updated_at}` &&
    prevMessage.i18n === nextMessage.i18n;

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
          attachment.type === FileTypes.Image
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

  const prevMyMessageTheme = JSON.stringify(prevMessagesContext?.myMessageTheme);
  const nextMyMessageTheme = JSON.stringify(nextMessagesContext?.myMessageTheme);

  const messageThemeEqual = prevMyMessageTheme === nextMyMessageTheme;
  if (!messageThemeEqual) return false;

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
  const { channel, enforceUniqueReaction, members } = useChannelContext<StreamChatGenerics>();
  const chatContext = useChatContext<StreamChatGenerics>();
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
        chatContext,
        dismissKeyboard,
        enforceUniqueReaction,
        members,
        messagesContext,
        openThread,
        setData,
        setOverlay,
        t,
      }}
      {...props}
    />
  );
};
