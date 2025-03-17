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
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { isVideoPlayerAvailable, NativeHandlers } from '../../native';
import { DefaultStreamChatGenerics, FileTypes } from '../../types/types';
import {
  hasOnlyEmojis,
  isBlockedMessage,
  isBouncedMessage,
  isEditedMessage,
  MessageStatusTypes,
} from '../../utils/utils';
import type { Thumbnail } from '../Attachment/utils/buildGallery/types';

import {
  isMessageWithStylesReadByAndDateSeparator,
  MessageType,
} from '../MessageList/hooks/useMessageList';

export type TouchableEmitter =
  | 'fileAttachment'
  | 'gallery'
  | 'giphy'
  | 'message'
  | 'messageContent'
  | 'messageReplies'
  | 'reactionList';

export type TextMentionTouchableHandlerAdditionalInfo<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = { user?: UserResponse<StreamChatGenerics> };

export type TextMentionTouchableHandlerPayload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  emitter: 'textMention';
  additionalInfo?: TextMentionTouchableHandlerAdditionalInfo<StreamChatGenerics>;
};

export type UrlTouchableHandlerAdditionalInfo = { url?: string };

export type UrlTouchableHandlerPayload = {
  emitter: 'textLink' | 'card';
  additionalInfo?: UrlTouchableHandlerAdditionalInfo;
};

export type FileAttachmentTouchableHandlerAdditionalInfo<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = { attachment?: Attachment<StreamChatGenerics> };

export type FileAttachmentTouchableHandlerPayload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  emitter: 'fileAttachment';
  additionalInfo?: FileAttachmentTouchableHandlerAdditionalInfo<StreamChatGenerics>;
};

export type GalleryThumbnailTouchableHandlerAdditionalInfo = { thumbnail?: Thumbnail };

export type GalleryThumbnailTouchableHandlerPayload = {
  emitter: 'gallery';
  additionalInfo?: GalleryThumbnailTouchableHandlerAdditionalInfo;
};

export type PressableHandlerPayload = {
  defaultHandler?: () => void;
  event?: GestureResponderEvent;
} & (
  | {
      emitter?: Exclude<
        TouchableEmitter,
        'textMention' | 'textLink' | 'card' | 'fileAttachment' | 'gallery'
      >;
    }
  | TextMentionTouchableHandlerPayload
  | UrlTouchableHandlerPayload
  | FileAttachmentTouchableHandlerPayload
  | GalleryThumbnailTouchableHandlerPayload
);

export type MessagePressableHandlerPayload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = PressableHandlerPayload & {
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
  markUnread: () => Promise<void>;
  pinMessage: () => Promise<void>;
  quotedReply: () => void;
  resendMessage: () => Promise<void>;
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
  Partial<
    Omit<
      MessageContextValue<StreamChatGenerics>,
      'groupStyles' | 'handleReaction' | 'message' | 'isMessageAIGenerated'
    >
  > &
  Pick<
    MessageContextValue<StreamChatGenerics>,
    'groupStyles' | 'message' | 'isMessageAIGenerated'
  > &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'sendReaction'
    | 'deleteMessage'
    | 'dismissKeyboardOnMessageTouch'
    | 'forceAlignMessages'
    | 'handleBan'
    | 'handleCopy'
    | 'handleDelete'
    | 'handleEdit'
    | 'handleFlag'
    | 'handleMarkUnread'
    | 'handleMute'
    | 'handlePinMessage'
    | 'handleQuotedReply'
    | 'handleReaction'
    | 'handleRetry'
    | 'handleThreadReply'
    | 'isAttachmentEqual'
    | 'MessageMenu'
    | 'messageActions'
    | 'messageContentOrder'
    | 'MessageBounce'
    | 'MessageSimple'
    | 'onLongPressMessage'
    | 'onPressInMessage'
    | 'onPressMessage'
    | 'removeMessage'
    | 'deleteReaction'
    | 'retrySendMessage'
    | 'selectReaction'
    | 'setEditingState'
    | 'setQuotedMessageState'
    | 'supportedReactions'
    | 'updateMessage'
    | 'PollContent'
  > &
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
  const [messageOverlayVisible, setMessageOverlayVisible] = useState(false);
  const [isErrorInMessage, setIsErrorInMessage] = useState(false);
  const [showMessageReactions, setShowMessageReactions] = useState(true);
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const [isEditedMessageOpen, setIsEditedMessageOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | undefined>(undefined);

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
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMarkUnread,
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
    MessageMenu,
    messagesContext,
    MessageSimple,
    onLongPressMessage: onLongPressMessageProp,
    onPressInMessage: onPressInMessageProp,
    onPressMessage: onPressMessageProp,
    onThreadSelect,
    openThread,
    preventPress,
    removeMessage,
    retrySendMessage,
    selectReaction,
    sendReaction,
    setEditingState,
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
  const isMessageAIGenerated = messagesContext.isMessageAIGenerated;
  const isAIGenerated = useMemo(
    () => isMessageAIGenerated(message),
    [message, isMessageAIGenerated],
  );
  const isMessageTypeDeleted = message.type === 'deleted';
  const { client } = chatContext;
  const {
    theme: {
      colors: { targetedMessageBackground },
      messageSimple: { targetedMessageContainer, unreadUnderlayColor },
      screenPadding,
    },
  } = useTheme();

  const showMessageOverlay = async (showMessageReactions = false, selectedReaction?: string) => {
    await dismissKeyboard();
    setShowMessageReactions(showMessageReactions);
    setMessageOverlayVisible(true);
    setSelectedReaction(selectedReaction);
  };

  const dismissOverlay = () => {
    setMessageOverlayVisible(false);
  };

  const actionsEnabled =
    message.type === 'regular' && message.status === MessageStatusTypes.RECEIVED;

  const isMyMessage = client && message && client.userID === message.user?.id;

  const handleAction = async (name: string, value: string) => {
    if (message.id) {
      const data = await channel?.sendAction(message.id, { [name]: value });
      if (data?.message) {
        updateMessage(data.message);
      } else {
        await removeMessage({
          id: message.id,
          parent_id: message.parent_id,
        });
      }
    }
  };

  const onPressQuotedMessage = (quotedMessage: MessageType<StreamChatGenerics>) => {
    if (!goToMessage) {
      return;
    }

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
      setIsErrorInMessage(true);
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
      showMessageOverlay();
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
              isVideoPlayerAvailable()
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
      case 'poll':
        return !!message.poll_id;
      case 'ai_text':
        return isAIGenerated;
      case 'text':
      default:
        return !!message.text;
    }
  });

  const emojiOnlyText = useMemo(() => {
    if (!message.text) {
      return false;
    }
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
    handleMarkUnreadMessage,
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
    copyMessage,
    deleteMessage,
    editMessage,
    flagMessage,
    handleReaction,
    markUnread,
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
    dismissOverlay,
    enforceUniqueReaction,
    handleBan,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMarkUnread,
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
    setQuotedMessageState,
    supportedReactions,
    t,
    updateMessage,
  });

  const isThreadMessage = threadList || !!message.parent_id;

  const messageActions =
    typeof messageActionsProp !== 'function'
      ? messageActionsProp
      : messageActionsProp({
          banUser,
          copyMessage,
          deleteMessage,
          dismissOverlay,
          editMessage,
          error: isErrorInMessage,
          flagMessage,
          isMyMessage,
          isThreadMessage,
          markUnread,
          message,
          muteUser,
          ownCapabilities,
          pinMessage,
          quotedReply,
          retry,
          showMessageReactions,
          threadReply,
          unpinMessage,
        });

  const actionHandlers: MessageActionHandlers<StreamChatGenerics> = {
    copyMessage: handleCopyMessage,
    deleteMessage: handleDeleteMessage,
    editMessage: handleEditMessage,
    flagMessage: handleFlagMessage,
    markUnread: handleMarkUnreadMessage,
    pinMessage: handleTogglePinMessage,
    quotedReply: handleQuotedReplyMessage,
    resendMessage: handleResendMessage,
    threadReply: handleThreadReply,
    toggleBanUser: handleToggleBanUser,
    toggleMuteUser: handleToggleMuteUser,
    toggleReaction: handleToggleReaction,
    unpinMessage: handleTogglePinMessage,
  };

  const onLongPress = () => {
    if (hasAttachmentActions || isBlockedMessage(message) || !enableLongPress) {
      return;
    }
    // If a message is bounced, on long press the message bounce options modal should open.
    if (isBouncedMessage(message)) {
      setIsBounceDialogOpen(true);
      return;
    }
    NativeHandlers.triggerHaptic('impactMedium');
    showMessageOverlay();
  };

  const messageContext = useCreateMessageContext({
    actionsEnabled,
    alignment,
    channel,
    dismissOverlay,
    files: attachments.files,
    goToMessage,
    groupStyles,
    handleAction,
    handleReaction,
    handleToggleReaction,
    hasReactions,
    images: attachments.images,
    isEditedMessageOpen,
    isMessageAIGenerated,
    isMyMessage,
    lastGroupMessage: groupStyles?.[0] === 'single' || groupStyles?.[0] === 'bottom',
    lastReceivedId,
    members,
    message,
    messageContentOrder,
    myMessageTheme: messagesContext.myMessageTheme,
    onLongPress: (payload) => {
      const onLongPressArgs = {
        actionHandlers,
        defaultHandler: payload?.defaultHandler || onLongPress,
        emitter: payload?.emitter || 'message',
        event: payload?.event,
        message,
      };

      const handleOnLongPress = () => {
        if (onLongPressMessageProp) {
          return onLongPressMessageProp(onLongPressArgs);
        }
        if (payload?.defaultHandler) {
          return payload.defaultHandler();
        }

        return onLongPress();
      };

      handleOnLongPress();
    },
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
        if (onPressMessageProp) {
          return onPressMessageProp(onPressArgs);
        }
        if (payload.defaultHandler) {
          return payload.defaultHandler();
        }

        return onPress();
      };

      handleOnPress();
    },
    onPressIn: onPressInMessageProp
      ? (payload) => {
          if (onPressInMessageProp) {
            return onPressInMessageProp({
              actionHandlers,
              defaultHandler: payload.defaultHandler,
              emitter: payload.emitter || 'message',
              event: payload.event,
              message,
            });
          }
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

  if (!(isMessageTypeDeleted || messageContentOrder.length)) {
    return null;
  }

  return (
    <MessageProvider value={messageContext}>
      <View
        style={[
          style,
          {
            backgroundColor: showUnreadUnderlay ? unreadUnderlayColor : undefined,
          },
        ]}
      >
        <View
          style={[
            { marginTop: 2, paddingHorizontal: screenPadding },
            (isTargetedMessage || message.pinned) && !isMessageTypeDeleted
              ? { backgroundColor: targetedMessageBackground, ...targetedMessageContainer }
              : {},
          ]}
          testID='message-wrapper'
        >
          <MessageSimple />
          {isBounceDialogOpen ? (
            <MessageBounce setIsBounceDialogOpen={setIsBounceDialogOpen} />
          ) : null}
          {messageOverlayVisible ? (
            <MessageMenu
              dismissOverlay={dismissOverlay}
              handleReaction={ownCapabilities.sendReaction ? handleReaction : undefined}
              messageActions={messageActions}
              selectedReaction={selectedReaction}
              showMessageReactions={showMessageReactions}
              visible={messageOverlayVisible}
            />
          ) : null}
        </View>
      </View>
    </MessageProvider>
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
  if (!membersEqual) {
    return false;
  }

  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!repliesEqual) {
    return false;
  }

  const lastReceivedIdChangedAndMatters =
    prevLastReceivedId !== nextLastReceivedId &&
    (prevLastReceivedId === prevMessage.id ||
      prevLastReceivedId === nextMessage.id ||
      nextLastReceivedId === prevMessage.id ||
      nextLastReceivedId === nextMessage.id);

  if (lastReceivedIdChangedAndMatters) {
    return false;
  }

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;

  if (goToMessageChangedAndMatters) {
    return false;
  }

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length && prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) {
    return false;
  }

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

  if (!messageEqual) {
    return false;
  }

  const isPrevQuotedMessageTypeDeleted = prevMessage.quoted_message?.type === 'deleted';
  const isNextQuotedMessageTypeDeleted = nextMessage.quoted_message?.type === 'deleted';

  const quotedMessageEqual =
    prevMessage.quoted_message?.id === nextMessage.quoted_message?.id &&
    isPrevQuotedMessageTypeDeleted === isNextQuotedMessageTypeDeleted;

  if (!quotedMessageEqual) {
    return false;
  }

  const messageUserBannedEqual = prevMessage.user?.banned === nextMessage.user?.banned;
  if (!messageUserBannedEqual) {
    return false;
  }

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

        if (isAttachmentEqual) {
          return (
            attachmentKeysEqual && !!isAttachmentEqual(attachment, nextMessageAttachments[index])
          );
        }

        return attachmentKeysEqual;
      })) ||
    prevMessageAttachments === nextMessageAttachments;
  if (!attachmentsEqual) {
    return false;
  }

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) && Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length === nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) => type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) {
    return false;
  }

  const mutedUserSame =
    prevMutedUsers.length === nextMutedUsers.length ||
    prevMutedUsers.some((mutedUser) => mutedUser.target.id === prevMessage.user?.id) ===
      nextMutedUsers.some((mutedUser) => mutedUser.target.id === nextMessage.user?.id);
  if (!mutedUserSame) {
    return false;
  }

  const showUnreadUnderlayEqual = prevShowUnreadUnderlay === nextShowUnreadUnderlay;
  if (!showUnreadUnderlayEqual) {
    return false;
  }

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const targetedMessageEqual = prevIsTargetedMessage === nextIsTargetedMessage;
  if (!targetedMessageEqual) {
    return false;
  }

  const prevMyMessageTheme = JSON.stringify(prevMessagesContext?.myMessageTheme);
  const nextMyMessageTheme = JSON.stringify(nextMessagesContext?.myMessageTheme);

  const messageThemeEqual = prevMyMessageTheme === nextMyMessageTheme;
  if (!messageThemeEqual) {
    return false;
  }

  return true;
};

const MemoizedMessage = React.memo(MessageWithContext, areEqual) as typeof MessageWithContext;

export type MessageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Omit<MessagePropsWithContext<StreamChatGenerics>, 'groupStyles' | 'handleReaction' | 'message'>
> &
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
  const messagesContext = useMessagesContext<StreamChatGenerics>();
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
        t,
      }}
      {...props}
    />
  );
};
