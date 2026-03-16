import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from 'react-native-teleport';

import type { Attachment, LocalMessage, UserResponse } from 'stream-chat';

import { useCreateMessageContext } from './hooks/useCreateMessageContext';
import { useMessageActionHandlers } from './hooks/useMessageActionHandlers';
import { useMessageActions } from './hooks/useMessageActions';
import { useMessageDeliveredData } from './hooks/useMessageDeliveryData';
import { useMessageReadData } from './hooks/useMessageReadData';
import { useProcessReactions } from './hooks/useProcessReactions';
import { measureInWindow } from './utils/measureInWindow';
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
  MessageComposerAPIContextValue,
  useMessageComposerAPIContext,
} from '../../contexts/messageComposerContext/MessageComposerAPIContext';
import { MessageContextValue, MessageProvider } from '../../contexts/messageContext/MessageContext';
import { useMessageListItemContext } from '../../contexts/messageListItemContext/MessageListItemContext';
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

import { useStableCallback } from '../../hooks';
import { isVideoPlayerAvailable, NativeHandlers } from '../../native';
import {
  closeOverlay,
  openOverlay,
  setOverlayBottomH,
  setOverlayMessageH,
  setOverlayTopH,
  useIsOverlayActive,
} from '../../state-store';
import { FileTypes } from '../../types/types';
import {
  checkMessageEquality,
  generateRandomId,
  hasOnlyEmojis,
  isBlockedMessage,
  isBouncedMessage,
  MessageStatusTypes,
} from '../../utils/utils';
import type { Thumbnail } from '../Attachment/utils/buildGallery/types';
import { dismissKeyboard } from '../KeyboardCompatibleView/KeyboardControllerAvoidingView';
import { BottomSheetModal } from '../UIComponents';

const createMessageOverlayId = (messageId?: string) =>
  `message-overlay-${messageId ?? 'unknown'}-${generateRandomId()}`;

export type TouchableEmitter =
  | 'failed-image'
  | 'fileAttachment'
  | 'gallery'
  | 'giphy'
  | 'message'
  | 'messageContent'
  | 'messageReplies'
  | 'reactionList';

export type TextMentionTouchableHandlerAdditionalInfo = { user?: UserResponse };

export type TextMentionTouchableHandlerPayload = {
  emitter: 'textMention';
  additionalInfo?: TextMentionTouchableHandlerAdditionalInfo;
};

export type UrlTouchableHandlerAdditionalInfo = { url?: string };

export type UrlTouchableHandlerPayload = {
  emitter: 'textLink' | 'urlPreview';
  additionalInfo?: UrlTouchableHandlerAdditionalInfo;
};

export type FileAttachmentTouchableHandlerAdditionalInfo = {
  attachment?: Attachment;
};

export type FileAttachmentTouchableHandlerPayload = {
  emitter: 'fileAttachment';
  additionalInfo?: FileAttachmentTouchableHandlerAdditionalInfo;
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
        'textMention' | 'textLink' | 'urlPreview' | 'fileAttachment' | 'gallery'
      >;
    }
  | TextMentionTouchableHandlerPayload
  | UrlTouchableHandlerPayload
  | FileAttachmentTouchableHandlerPayload
  | GalleryThumbnailTouchableHandlerPayload
);

export type MessagePressableHandlerPayload = PressableHandlerPayload & {
  /**
   * Set of action handler functions for various message actions. You can use these functions to perform any action when give interaction occurs.
   */
  actionHandlers?: MessageActionHandlers;
  /**
   * Additional message touchable handler info.
   */
  additionalInfo?: Record<string, unknown>;
  /**
   * Message object, on which interaction occurred.
   */
  message?: LocalMessage;
};

export type MessageActionHandlers = {
  copyMessage: () => void;
  deleteMessage: () => void;
  deleteForMeMessage: () => void;
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
  threadReply?: (message: LocalMessage) => Promise<void>;
};

export type MessagePropsWithContext = Pick<
  ChannelContextValue,
  'channel' | 'enforceUniqueReaction' | 'members'
> &
  Pick<KeyboardContextValue, 'dismissKeyboard'> &
  Partial<
    Omit<
      MessageContextValue,
      | 'groupStyles'
      | 'handleReaction'
      | 'message'
      | 'isMessageAIGenerated'
      | 'deliveredToCount'
      | 'readBy'
    >
  > &
  Pick<
    MessageContextValue,
    'groupStyles' | 'message' | 'isMessageAIGenerated' | 'readBy' | 'deliveredToCount'
  > &
  Pick<
    MessagesContextValue,
    | 'sendReaction'
    | 'deleteMessage'
    | 'dismissKeyboardOnMessageTouch'
    | 'forceAlignMessages'
    | 'handleBan'
    | 'handleCopy'
    | 'handleDelete'
    | 'handleDeleteForMe'
    | 'handleEdit'
    | 'handleFlag'
    | 'handleMarkUnread'
    | 'handleMute'
    | 'handlePinMessage'
    | 'handleQuotedReply'
    | 'handleReaction'
    | 'handleRetry'
    | 'handleThreadReply'
    | 'handleBlockUser'
    | 'isAttachmentEqual'
    | 'MessageMenu'
    | 'messageActions'
    | 'messageContentOrder'
    | 'MessageBounce'
    | 'MessageBlocked'
    | 'MessageSimple'
    | 'onLongPressMessage'
    | 'onPressInMessage'
    | 'onPressMessage'
    | 'removeMessage'
    | 'deleteReaction'
    | 'retrySendMessage'
    | 'selectReaction'
    | 'supportedReactions'
    | 'updateMessage'
    | 'PollContent'
    // TODO: remove this comment later, using it as a pragma mark
    | 'MessageUserReactions'
    | 'MessageUserReactionsAvatar'
    | 'MessageUserReactionsItem'
    | 'MessageReactionPicker'
    | 'MessageActionList'
    | 'MessageActionListItem'
  > &
  Pick<ThreadContextValue, 'openThread'> &
  Pick<TranslationContextValue, 't'> & {
    chatContext: ChatContextValue;
    messagesContext: MessagesContextValue;
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
    onThreadSelect?: (message: LocalMessage) => void;
    showUnreadUnderlay?: boolean;
    style?: StyleProp<ViewStyle>;
  } & Pick<MessageComposerAPIContextValue, 'setQuotedMessage' | 'setEditingState'>;

/**
 * Since this component doesn't consume `messages` from `MessagesContext`,
 * we memoized and broke it up to prevent new messages from re-rendering
 * each individual Message component.
 */
const MessageWithContext = (props: MessagePropsWithContext) => {
  const [isErrorInMessage, setIsErrorInMessage] = useState(false);
  const [showMessageReactions, setShowMessageReactions] = useState<boolean>(false);
  const [selectedReaction, setSelectedReaction] = useState<string | undefined>(undefined);
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);

  const {
    channel,
    chatContext,
    deleteMessage: deleteMessageFromContext,
    deleteReaction,
    deliveredToCount,
    dismissKeyboardOnMessageTouch,
    enableLongPress = true,
    enforceUniqueReaction,
    forceAlignMessages = false,
    goToMessage,
    groupStyles = ['bottom'],
    handleBan,
    handleCopy,
    handleDelete,
    handleDeleteForMe,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction: handleReactionProp,
    handleRetry,
    handleThreadReply,
    handleBlockUser,
    isTargetedMessage,
    members,
    message,
    messageActions: messageActionsProp = defaultMessageActions,
    MessageBlocked,
    MessageBounce,
    messageContentOrder: messageContentOrderProp,
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
    showAvatar,
    showMessageStatus,
    showUnreadUnderlay,
    style,
    supportedReactions,
    t,
    threadList = false,
    updateMessage,
    readBy,
    setQuotedMessage,
    MessageUserReactions,
    MessageUserReactionsAvatar,
    MessageUserReactionsItem,
    MessageReactionPicker,
    MessageActionList,
    MessageActionListItem,
  } = props;
  // TODO: V9: Reconsider using safe area insets in every message.
  const insets = useSafeAreaInsets();
  const isMessageAIGenerated = messagesContext.isMessageAIGenerated;
  const isAIGenerated = useMemo(
    () => isMessageAIGenerated(message),
    [message, isMessageAIGenerated],
  );
  const messageOverlayId = useMemo(() => createMessageOverlayId(message.id), [message.id]);
  const isMessageTypeDeleted = message.type === 'deleted';
  const { client } = chatContext;

  const [rect, setRect] = useState<{ w: number; h: number; x: number; y: number } | undefined>(
    undefined,
  );
  const { width: screenW } = useWindowDimensions();

  const showMessageOverlay = useStableCallback(async () => {
    dismissKeyboard();
    try {
      const layout = await measureInWindow(messageWrapperRef, insets);
      setRect(layout);
      setOverlayMessageH(layout);
      openOverlay({ id: messageOverlayId, messageId: message.id });
    } catch (e) {
      console.error(e);
    }
  });

  const showReactionsOverlay = useStableCallback((reactionType?: string) => {
    setShowMessageReactions(true);
    setSelectedReaction(reactionType);
  });

  const { setNativeScrollability } = useMessageListItemContext();

  const dismissOverlay = () => {
    closeOverlay();
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

  const onPressQuotedMessage = (quotedMessage: LocalMessage) => {
    if (!goToMessage) {
      return;
    }

    goToMessage(quotedMessage.id);
  };

  const errorOrFailed = message.type === 'error' || message.status === MessageStatusTypes.FAILED;

  const onPress = (error = errorOrFailed) => {
    if (dismissKeyboardOnMessageTouch) {
      dismissKeyboard();
    }
    const quotedMessage = message.quoted_message;
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
                ...cur,
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
            } else if (cur.type === FileTypes.Image && (cur.og_scrape_url || cur.title_link)) {
              acc.files.push(cur);
            } else if (!acc.files.length && !acc.images.length && !acc.videos.length) {
              acc.other.push(cur);
            }

            return acc;
          },
          {
            files: [] as Attachment[],
            images: [] as Attachment[],
            other: [] as Attachment[],
            videos: [] as Attachment[],
          },
        )
      : {
          files: [] as Attachment[],
          images: [] as Attachment[],
          other: [] as Attachment[],
          videos: [] as Attachment[],
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
      case 'location':
        return !!message.shared_location;
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
    handleDeleteForMeMessage,
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
    setQuotedMessage,
    supportedReactions,
  });

  const {
    banUser,
    copyMessage,
    deleteMessage,
    deleteForMeMessage,
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
    blockUser,
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
    handleDeleteForMe,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction: handleReactionProp,
    handleRetry,
    handleThreadReply,
    handleBlockUser,
    message,
    onThreadSelect,
    openThread,
    removeMessage,
    retrySendMessage,
    selectReaction,
    sendReaction,
    setEditingState,
    setQuotedMessage,
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
          deleteForMeMessage,
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
          threadReply,
          unpinMessage,
          updateMessage,
          blockUser,
        });

  const actionHandlers: MessageActionHandlers = {
    copyMessage: handleCopyMessage,
    deleteForMeMessage: handleDeleteForMeMessage,
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

  const messageWrapperRef = useRef<View>(null);

  const onLongPress = () => {
    setNativeScrollability(false);
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

  const frozenMessage = useRef(message);
  const { active: overlayActive } = useIsOverlayActive(messageOverlayId);

  const messageHasOnlySingleAttachment =
    !message.text && !message.quoted_message && message.attachments?.length === 1;

  const messageContext = useCreateMessageContext({
    actionsEnabled,
    alignment,
    channel,
    deliveredToCount,
    dismissOverlay,
    files: attachments.files,
    goToMessage,
    groupStyles,
    handleAction,
    handleReaction,
    handleToggleReaction,
    hasReactions,
    images: attachments.images,
    isMessageAIGenerated,
    isMyMessage,
    lastGroupMessage: groupStyles?.[0] === 'single' || groupStyles?.[0] === 'bottom',
    members,
    message: overlayActive ? frozenMessage.current : message,
    messageOverlayId,
    messageContentOrder,
    messageHasOnlySingleAttachment,
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
        if (errorOrFailed) {
          onPress(true);
          return;
        }

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
    onThreadSelect,
    otherAttachments: attachments.other,
    preventPress: overlayActive ? true : preventPress,
    reactions,
    readBy,
    setQuotedMessage,
    showAvatar,
    showMessageOverlay,
    showReactionsOverlay,
    showMessageStatus: typeof showMessageStatus === 'boolean' ? showMessageStatus : isMyMessage,
    threadList,
    videos: attachments.videos,
  });

  const prevActive = useRef<boolean>(overlayActive);

  useEffect(() => {
    if (!overlayActive && prevActive.current && setNativeScrollability) {
      setNativeScrollability(true);
    }
    prevActive.current = overlayActive;
  }, [setNativeScrollability, overlayActive]);

  useEffect(() => {
    if (!overlayActive) {
      frozenMessage.current = message;
    }
  }, [overlayActive, message]);

  const styles = useStyles({
    showUnreadUnderlay,
    highlightedMessage: (isTargetedMessage || message.pinned) && !isMessageTypeDeleted,
  });

  if (!(isMessageTypeDeleted || messageContentOrder.length)) {
    return null;
  }

  if (isBlockedMessage(message)) {
    return <MessageBlocked message={message} />;
  }

  return (
    <MessageProvider value={messageContext}>
      <View style={[style, styles.wrapper]} testID='message-wrapper'>
        {overlayActive && rect ? (
          <View
            style={{
              height: rect.h,
              width: rect.w,
            }}
          />
        ) : null}
        {/*TODO: V9: Find a way to separate these in a dedicated file*/}
        <Portal hostName={overlayActive && rect ? 'top-item' : undefined}>
          {overlayActive && rect ? (
            <View
              onLayout={(e) => {
                const { width: w, height: h } = e.nativeEvent.layout;

                setOverlayTopH({
                  h,
                  w,
                  x: isMyMessage ? screenW - rect.x - w : rect.x,
                  y: rect.y - h,
                });
              }}
            >
              <MessageReactionPicker
                dismissOverlay={dismissOverlay}
                handleReaction={ownCapabilities.sendReaction ? handleReaction : undefined}
              />
            </View>
          ) : null}
        </Portal>
        <Portal
          hostName={overlayActive ? 'message-overlay' : undefined}
          style={overlayActive && rect ? { width: rect.w } : undefined}
        >
          <MessageSimple ref={messageWrapperRef} />
        </Portal>
        {showMessageReactions ? (
          <BottomSheetModal
            lazy={true}
            onClose={() => setShowMessageReactions(false)}
            visible={showMessageReactions}
            height={424}
          >
            <MessageUserReactions
              message={message}
              MessageUserReactionsAvatar={MessageUserReactionsAvatar}
              MessageUserReactionsItem={MessageUserReactionsItem}
              selectedReaction={selectedReaction}
            />
          </BottomSheetModal>
        ) : null}
        <Portal hostName={overlayActive && rect ? 'bottom-item' : undefined}>
          {overlayActive && rect ? (
            <View
              onLayout={(e) => {
                const { width: w, height: h } = e.nativeEvent.layout;
                setOverlayBottomH({
                  h,
                  w,
                  x: isMyMessage ? screenW - rect.x - w : rect.x,
                  y: rect.y + rect.h,
                });
              }}
            >
              <MessageActionList
                dismissOverlay={dismissOverlay}
                MessageActionListItem={MessageActionListItem}
                messageActions={messageActions}
              />
            </View>
          ) : null}
        </Portal>
        {isBounceDialogOpen ? (
          <MessageBounce setIsBounceDialogOpen={setIsBounceDialogOpen} />
        ) : null}
      </View>
    </MessageProvider>
  );
};

const areEqual = (prevProps: MessagePropsWithContext, nextProps: MessagePropsWithContext) => {
  const {
    chatContext: { mutedUsers: prevMutedUsers },
    deliveredToCount: prevDeliveredBy,
    goToMessage: prevGoToMessage,
    groupStyles: prevGroupStyles,
    isAttachmentEqual,
    isTargetedMessage: prevIsTargetedMessage,
    members: prevMembers,
    message: prevMessage,
    messagesContext: prevMessagesContext,
    showUnreadUnderlay: prevShowUnreadUnderlay,
    readBy: prevReadBy,
    t: prevT,
  } = prevProps;
  const {
    chatContext: { mutedUsers: nextMutedUsers },
    deliveredToCount: nextDeliveredBy,
    goToMessage: nextGoToMessage,
    groupStyles: nextGroupStyles,
    isTargetedMessage: nextIsTargetedMessage,
    members: nextMembers,
    message: nextMessage,
    messagesContext: nextMessagesContext,
    showUnreadUnderlay: nextShowUnreadUnderlay,
    readBy: nextReadBy,
    t: nextT,
  } = nextProps;

  const deliveredByEqual = prevDeliveredBy === nextDeliveredBy;
  if (!deliveredByEqual) {
    return false;
  }

  const readByEqual = prevReadBy === nextReadBy;
  if (!readByEqual) {
    return false;
  }

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) {
    return false;
  }

  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!repliesEqual) {
    return false;
  }

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;

  if (goToMessageChangedAndMatters) {
    return false;
  }

  const groupStylesEqual = prevGroupStyles === nextGroupStyles;
  if (!groupStylesEqual) {
    return false;
  }

  const messageEqual = checkMessageEquality(prevMessage, nextMessage);

  if (!messageEqual) {
    return false;
  }

  const quotedMessageEqual = checkMessageEquality(
    prevMessage.quoted_message,
    nextMessage.quoted_message,
  );

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

  const quotedMessageAttachmentsEqual =
    prevMessage.quoted_message?.attachments?.length ===
    nextMessage.quoted_message?.attachments?.length;

  if (!quotedMessageAttachmentsEqual) {
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

  const prevSharedLocation = prevMessage.shared_location;
  const nextSharedLocation = nextMessage.shared_location;
  const sharedLocationEqual =
    prevSharedLocation?.latitude === nextSharedLocation?.latitude &&
    prevSharedLocation?.longitude === nextSharedLocation?.longitude &&
    prevSharedLocation?.end_at === nextSharedLocation?.end_at;

  if (!sharedLocationEqual) {
    return false;
  }

  return true;
};

const MemoizedMessage = React.memo(MessageWithContext, areEqual) as typeof MessageWithContext;

export type MessageProps = Partial<
  Omit<MessagePropsWithContext, 'groupStyles' | 'handleReaction' | 'message'>
> &
  Pick<MessagePropsWithContext, 'groupStyles' | 'message'>;

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./Message.md
 */
export const Message = (props: MessageProps) => {
  const { message } = props;
  const { channel, enforceUniqueReaction, members } = useChannelContext();
  const chatContext = useChatContext();
  const { dismissKeyboard } = useKeyboardContext();
  const messagesContext = useMessagesContext();
  const { openThread } = useThreadContext();
  const { t } = useTranslationContext();
  const readBy = useMessageReadData({ message });
  const deliveredTo = useMessageDeliveredData({ message });
  const { setQuotedMessage, setEditingState } = useMessageComposerAPIContext();

  return (
    <MemoizedMessage
      {...messagesContext}
      {...{
        channel,
        chatContext,
        deliveredToCount: deliveredTo.length,
        dismissKeyboard,
        enforceUniqueReaction,
        members,
        messagesContext,
        openThread,
        readBy: readBy.length,
        setEditingState,
        setQuotedMessage,
        t,
      }}
      {...props}
    />
  );
};

const useStyles = ({
  showUnreadUnderlay,
  highlightedMessage,
}: {
  showUnreadUnderlay?: boolean;
  highlightedMessage?: boolean;
}) => {
  const {
    theme: {
      colors: { bg_gradient_start },
      messageSimple: { wrapper, unreadUnderlayColor = bg_gradient_start, targetedMessageContainer },
      screenPadding,
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      wrapper: {
        paddingHorizontal: screenPadding,
        backgroundColor: showUnreadUnderlay ? unreadUnderlayColor : undefined,
        ...(highlightedMessage
          ? { backgroundColor: semantics.backgroundCoreHighlight, ...targetedMessageContainer }
          : {}),
        ...wrapper,
      },
    });
  }, [
    wrapper,
    screenPadding,
    showUnreadUnderlay,
    unreadUnderlayColor,
    highlightedMessage,
    semantics,
    targetedMessageContainer,
  ]);
};
