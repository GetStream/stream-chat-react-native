import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Clipboard,
  GestureResponderEvent,
  Image,
  Keyboard,
  PixelRatio,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useCreateMessageContext } from './hooks/useCreateMessageContext';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  ChatContextValue,
  useChatContext,
} from '../../contexts/chatContext/ChatContext';
import {
  KeyboardContextValue,
  useKeyboardContext,
} from '../../contexts/keyboardContext/KeyboardContext';
import {
  Alignment,
  MessageContextValue,
  MessageProvider,
  Reactions,
} from '../../contexts/messageContext/MessageContext';
import {
  MessageAction,
  MessageOverlayContextValue,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import {
  GroupType,
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import {
  Copy,
  CurveLineLeftUp,
  Delete,
  Edit,
  MessageFlag,
  Mute,
  SendUp,
  ThreadReply,
  UserDelete,
} from '../../icons';
import { triggerHaptic } from '../../native';
import { emojiRegex } from '../../utils/utils';

import type {
  Attachment,
  MessageResponse,
  Reaction,
  ReactionResponse,
  Message as StreamMessage,
} from 'stream-chat';

import type { MessageType } from '../MessageList/hooks/useMessageList';

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

const prefetchImage = ({
  height,
  url,
}: {
  height: number | string;
  url: string;
}) => {
  if (url.includes('&h=%2A')) {
    Image.prefetch(
      url.replace(
        'h=%2A',
        `h=${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`,
      ),
    )
      .catch(() => Image.prefetch(url))
      .catch(() => {
        // do nothing, not a big deal that prefetch failed
      });
  } else {
    Image.prefetch(url).catch(() => {
      // do nothing, not a big deal that prefetch failed
    });
  }
};

export type MessagePropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'channel'
  | 'disabled'
  | 'enforceUniqueReaction'
  | 'isAdmin'
  | 'isModerator'
  | 'isOwner'
> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<KeyboardContextValue, 'dismissKeyboard'> &
  Partial<
    Omit<
      MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      'groupStyles' | 'message'
    >
  > &
  Pick<
    MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'groupStyles' | 'message'
  > &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'dismissKeyboardOnMessageTouch'
    | 'messageContentOrder'
    | 'MessageSimple'
    | 'onDoubleTapMessage'
    | 'onLongPressMessage'
    | 'OverlayReactionList'
    | 'removeMessage'
    | 'reactionsEnabled'
    | 'repliesEnabled'
    | 'retrySendMessage'
    | 'setEditingState'
    | 'setQuotedMessageState'
    | 'supportedReactions'
    | 'updateMessage'
  > &
  Pick<MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'setData'> &
  Pick<OverlayContextValue, 'setOverlay'> &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'openThread'> &
  Pick<TranslationContextValue, 't'> & {
    /**
     * Whether or not users are able to long press messages.
     */
    enableLongPress?: boolean;
    /**
     * Force alignment of message to left or right - 'left' | 'right'
     * By default, current user's messages will be aligned to right and other user's messages will be aligned to left.
     * */
    forceAlign?: Alignment | boolean;
    goToMessage?: (messageId: string) => void;
    /** Handler to delete a current message */
    handleDelete?: () => Promise<void>;
    /**
     * Handler to edit a current message. This function sets the current message as the `editing` property of channel context.
     * The `editing` prop is used by the MessageInput component to switch to edit mode.
     */
    handleEdit?: () => void;
    /** Handler to flag the message */
    handleFlag?: () => Promise<void>;
    /** Handler to mute the user */
    handleMute?: () => Promise<void>;
    /** Handler to process a reaction */
    handleReaction?: (reactionType: string) => Promise<void>;
    /** Handler to resend the message */
    handleRetry?: () => Promise<void>;
    /**
     * Array of allowed actions on message
     * If all the actions need to be disabled an empty array should be provided as value of prop
     */
    messageActions?: MessageAction[];
    /**
     * You can call methods available on the Message
     * component such as handleEdit, handleDelete, handleAction etc.
     *
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/Message.tsx)
     *
     * By default, we show the overlay with all the message actions on long press.
     *
     * @param message Message object which was long pressed
     * @param event   Event object for onLongPress event
     **/
    onLongPress?: (
      message: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
      event?: GestureResponderEvent,
    ) => void;
    /**
     * You can call methods available on the Message
     * component such as handleEdit, handleDelete, handleAction etc.
     *
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/Message.tsx)
     *
     * By default, we will dismiss the keyboard on press.
     *
     * @param message Message object which was long pressed
     * @param event   Event object for onLongPress event
     * */
    onPress?: (
      message: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
      event: GestureResponderEvent,
    ) => void;
    /**
     * Handler to open the thread on message. This is callback for touch event for replies button.
     *
     * @param message A message object to open the thread upon.
     */
    onThreadSelect?: (message: MessageType<At, Ch, Co, Ev, Me, Re, Us>) => void;
    showUnreadUnderlay?: boolean;
    style?: StyleProp<ViewStyle>;
    targetedMessage?: boolean;
  };

/**
 * Since this component doesn't consume `messages` from `MessagesContext`,
 * we memoized and broke it up to prevent new messages from re-rendering
 * each individual Message component.
 */
const MessageWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    animatedLongPress = Platform.OS === 'ios' && !props.message.deleted_at,
    channel,
    client,
    disabled,
    dismissKeyboard,
    dismissKeyboardOnMessageTouch,
    enableLongPress = true,
    enforceUniqueReaction,
    forceAlign = false,
    goToMessage,
    groupStyles = ['bottom'],
    handleReaction: handleReactionProp,
    isAdmin,
    isModerator,
    isOwner,
    lastReceivedId,
    message,
    messageActions: messageActionsProp,
    messageContentOrder: messageContentOrderProp,
    MessageSimple,
    onDoubleTapMessage: onDoubleTapMessageProp,
    onLongPress: onLongPressProp,
    onLongPressMessage: onLongPressMessageProp,
    onPress: onPressProp,
    onThreadSelect,
    openThread,
    OverlayReactionList,
    preventPress,
    reactionsEnabled,
    removeMessage,
    repliesEnabled,
    retrySendMessage,
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
    targetedMessage,
    threadList = false,
    updateMessage,
  } = props;

  const {
    theme: {
      colors: {
        accent_blue,
        accent_red,
        bg_gradient_start,
        grey,
        targetedMessageBackground,
      },
      messageSimple: {
        gallery: { halfSize, size },
        targetedMessageUnderlay,
      },
    },
  } = useTheme();

  const doubleTapRef = useRef<TapGestureHandler>(null);
  const pressActive = useSharedValue(false);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          scale: scale.value,
        },
      ],
    }),
    [],
  );
  const targetedOpacity = useSharedValue(0);
  const targetedStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: targetedOpacity.value,
    }),
    [],
  );

  useEffect(() => {
    targetedOpacity.value = withTiming(targetedMessage ? 1 : 0, {
      duration: 1000,
    });
  }, [targetedMessage]);

  const actionsEnabled =
    message.type === 'regular' && message.status === 'received';

  const isMyMessage = client && message && client.userID === message.user?.id;

  const canModifyMessage = isMyMessage || isModerator || isOwner || isAdmin;

  const handleAction = async (name: string, value: string) => {
    if (message.id) {
      const data = await channel?.sendAction(message.id, { [name]: value });
      if (data?.message) {
        updateMessage(data.message);
      } else {
        removeMessage({
          id: message.id,
          parent_id: message.parent_id as StreamMessage<
            At,
            Me,
            Us
          >['parent_id'],
        });
      }
    }
  };

  const onPress = (
    error = message.type === 'error' || message.status === 'failed',
  ) => {
    if (dismissKeyboardOnMessageTouch) {
      Keyboard.dismiss();
    }
    const quotedMessage = message.quoted_message as MessageType<
      At,
      Ch,
      Co,
      Ev,
      Me,
      Re,
      Us
    >;
    if (error) {
      showMessageOverlay(false, true);
    } else if (goToMessage && quotedMessage) {
      pressActive.value = false;
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 100 });
      goToMessage(quotedMessage.id);
    }
  };

  const alignment =
    forceAlign && (forceAlign === 'left' || forceAlign === 'right')
      ? forceAlign
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
    !message.deleted_at && Array.isArray(message.attachments)
      ? message.attachments.reduce(
          (acc, cur) => {
            if (cur.type === 'file') {
              acc.files.push(cur);
              acc.other = []; // remove other attachments if a file exists
            } else if (
              cur.type === 'image' &&
              !cur.title_link &&
              !cur.og_scrape_url
            ) {
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
            files: [] as Attachment<At>[],
            images: [] as Attachment<At>[],
            other: [] as Attachment<At>[],
          },
        )
      : {
          files: [] as Attachment<At>[],
          images: [] as Attachment<At>[],
          other: [] as Attachment<At>[],
        };

  /**
   * Check if any actions to prevent long press
   */
  const hasAttachmentActions =
    !message.deleted_at &&
    Array.isArray(message.attachments) &&
    message.attachments.some(
      (attachment) => attachment.actions && attachment.actions.length,
    );

  // prefetch images for Gallery component rendering
  const attachmentImageLength = attachments.images.length;
  useEffect(() => {
    if (attachmentImageLength) {
      attachments.images.slice(0, 4).forEach((image, index) => {
        const url = image.image_url || image.thumb_url;
        if (url) {
          if (attachmentImageLength <= 2) {
            prefetchImage({ height: size || 200, url });
          } else if (attachmentImageLength === 3) {
            if (index === 0) {
              prefetchImage({ height: size || 200, url });
            } else {
              prefetchImage({ height: halfSize || 100, url });
            }
          } else {
            prefetchImage({ height: halfSize || 100, url });
          }
        }
      });
    }
  }, [attachmentImageLength]);

  const messageContentOrder = messageContentOrderProp.filter((content) => {
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

  const forwardedGroupStyles =
    !!reactionsEnabled &&
    message.latest_reactions &&
    message.latest_reactions.length > 0
      ? (['bottom'] as GroupType[])
      : groupStyles;

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
    !!reactionsEnabled &&
    !message.deleted_at &&
    !!message.latest_reactions &&
    message.latest_reactions.length > 0;

  const clientId = client.userID;

  const reactions = hasReactions
    ? supportedReactions.reduce((acc, cur) => {
        const reactionType = cur.type;
        const reactionsOfReactionType = (message.latest_reactions as ReactionResponse<
          Re,
          Us
        >[]).filter((reaction) => reaction.type === reactionType);

        if (reactionsOfReactionType.length) {
          const hasOwnReaction = reactionsOfReactionType.some(
            (reaction) => reaction.user_id === clientId,
          );
          acc.push({ own: hasOwnReaction, type: reactionType });
        }

        return acc;
      }, [] as Reactions)
    : [];

  const showMessageOverlay = async (
    messageReactions = false,
    error = message.type === 'error' || message.status === 'failed',
  ) => {
    await dismissKeyboard();

    const blockUser = {
      action: () => async () => {
        setOverlay('none');
        if (message.user?.id) {
          if (message.user.banned) {
            await client.unbanUser(message.user.id);
          } else {
            await client.banUser(message.user.id);
          }
        }
      },
      icon: <UserDelete pathFill={grey} />,
      title: message.user?.banned ? t('Unblock User') : t('Block User'),
    };

    const copyMessage = {
      // using depreciated Clipboard from react-native until expo supports the community version or their own
      action: () => {
        setOverlay('none');
        Clipboard.setString(message.text || '');
      },
      icon: <Copy pathFill={grey} />,
      title: t('Copy Message'),
    };

    const deleteMessage = {
      action: () => {
        setOverlay('alert');
        if (message.id) {
          Alert.alert(
            t('Delete Message'),
            t('Are you sure you want to permanently delete this message?'),
            [
              { onPress: () => setOverlay('none'), text: t('Cancel') },
              {
                onPress: async () => {
                  setOverlay('none');
                  const data = await client.deleteMessage(message.id);
                  updateMessage(data.message);
                },
                style: 'destructive',
                text: t('Delete'),
              },
            ],
            { cancelable: false },
          );
        }
      },
      icon: <Delete pathFill={accent_red} />,
      title: t('Delete Message'),
      titleStyle: { color: accent_red },
    };

    const editMessage = {
      action: () => {
        setOverlay('none');
        setEditingState(message);
      },
      icon: <Edit pathFill={grey} />,
      title: t('Edit Message'),
    };

    const flagMessage = {
      action: () => {
        setOverlay('alert');
        if (message.id) {
          Alert.alert(
            t('Flag Message'),
            t(
              'Do you want to send a copy of this message to a moderator for further investigation?',
            ),
            [
              { onPress: () => setOverlay('none'), text: t('Cancel') },
              {
                onPress: async () => {
                  try {
                    await client.flagMessage(message.id);
                    Alert.alert(
                      t('Message flagged'),
                      t('The message has been reported to a moderator.'),
                      [
                        {
                          onPress: () => setOverlay('none'),
                          text: t('Dismiss'),
                        },
                      ],
                    );
                  } catch (err) {
                    Alert.alert(
                      t('Something went wrong'),
                      t("The operation couldn't be completed."),
                      [
                        {
                          onPress: () => setOverlay('none'),
                          text: t('Dismiss'),
                        },
                      ],
                    );
                  }
                },
                text: t('Flag'),
              },
            ],
            { cancelable: false },
          );
        }
      },
      icon: <MessageFlag pathFill={grey} />,
      title: t('Flag Message'),
    };

    const handleReaction = !error
      ? handleReactionProp
        ? handleReactionProp
        : async (reactionType: string) => {
            const messageId = message.id;
            const ownReaction = !!reactions.find(
              (reaction) => reaction.own && reaction.type === reactionType,
            );

            // Change reaction in local state, make API call in background, revert to old message if fails
            try {
              if (channel && messageId) {
                if (ownReaction) {
                  await channel.deleteReaction(messageId, reactionType);
                } else {
                  await channel.sendReaction(
                    messageId,
                    {
                      type: reactionType,
                    } as Reaction<Re, Us>,
                    undefined,
                    enforceUniqueReaction,
                  );
                }
              }
            } catch (err) {
              console.log(err);
            }
          }
      : undefined;

    const isMuted = (client.mutedUsers || []).some(
      (mute) =>
        mute.user.id === client.userID && mute.target.id === message.user?.id,
    );
    const muteUser = {
      action: async () => {
        setOverlay('none');
        if (message.user?.id) {
          if (isMuted) {
            await client.unmuteUser(message.user.id);
          } else {
            await client.muteUser(message.user.id);
          }
        }
      },
      icon: <Mute pathFill={grey} />,
      title: isMuted ? t('Unmute User') : t('Mute User'),
    };

    const reply = {
      action: () => {
        setOverlay('none');
        setQuotedMessageState(message);
      },
      icon: <CurveLineLeftUp pathFill={grey} />,
      title: t('Reply'),
    };

    const resend = {
      action: async () => {
        setOverlay('none');
        await retrySendMessage({
          ...message,
          updated_at: undefined,
        } as MessageResponse<At, Ch, Co, Me, Re, Us>);
      },
      icon: <SendUp pathFill={accent_blue} />,
      title: t('Resend'),
    };

    const threadReply = {
      action: () => {
        setOverlay('none');
        onOpenThread();
      },
      icon: <ThreadReply pathFill={grey} />,
      title: t('Thread Reply'),
    };

    const isThreadMessage = threadList || !!message.parent_id;

    setData({
      alignment,
      clientId: client.userID,
      files: attachments.files,
      groupStyles,
      handleReaction: reactionsEnabled ? handleReaction : undefined,
      images: attachments.images,
      message,
      messageActions: error
        ? messageActionsProp || [resend, editMessage, deleteMessage]
        : messageReactions
        ? undefined
        : messageActionsProp || canModifyMessage
        ? isThreadMessage
          ? message.text
            ? [editMessage, copyMessage, flagMessage, deleteMessage]
            : [editMessage, flagMessage, deleteMessage]
          : message.text
          ? repliesEnabled
            ? [
                reply,
                threadReply,
                editMessage,
                copyMessage,
                flagMessage,
                deleteMessage,
              ]
            : [editMessage, copyMessage, flagMessage, deleteMessage]
          : repliesEnabled
          ? [reply, threadReply, editMessage, flagMessage, deleteMessage]
          : [editMessage, flagMessage, deleteMessage]
        : isThreadMessage
        ? message.text
          ? [copyMessage, muteUser, flagMessage, blockUser, deleteMessage]
          : [muteUser, blockUser, flagMessage, deleteMessage]
        : message.text
        ? repliesEnabled
          ? [
              reply,
              threadReply,
              copyMessage,
              muteUser,
              flagMessage,
              blockUser,
              deleteMessage,
            ]
          : [copyMessage, muteUser, flagMessage, blockUser, deleteMessage]
        : repliesEnabled
        ? [reply, threadReply, muteUser, blockUser, deleteMessage]
        : [muteUser, blockUser, deleteMessage],
      messageContentOrder,
      messageReactionTitle:
        !error && messageReactions ? t('Message Reactions') : undefined,
      onlyEmojis,
      otherAttachments: attachments.other,
      OverlayReactionList,
      supportedReactions,
      threadList,
    });

    setOverlay('message');
  };

  const onLongPressMessage =
    disabled || hasAttachmentActions
      ? () => null
      : onLongPressProp
      ? (event?: GestureResponderEvent) => onLongPressProp(message, event)
      : enableLongPress
      ? () => showMessageOverlay(false)
      : () => null;

  const handleReactionDoubleTap =
    message.type !== 'error' && message.status !== 'failed'
      ? handleReactionProp
        ? handleReactionProp
        : async (reactionType: string) => {
            const messageId = message.id;
            const ownReaction = !!reactions.find(
              (reaction) => reaction.own && reaction.type === reactionType,
            );

            // Change reaction in local state, make API call in background, revert to old message if fails
            try {
              if (channel && messageId) {
                if (ownReaction) {
                  await channel.deleteReaction(messageId, reactionType);
                } else {
                  await channel.sendReaction(
                    messageId,
                    {
                      type: reactionType,
                    } as Reaction<Re, Us>,
                    undefined,
                    enforceUniqueReaction,
                  );
                }
              }
            } catch (err) {
              console.log(err);
            }
          }
      : undefined;

  const onDoubleTapMessage = () => {
    if (onDoubleTapMessageProp) {
      onDoubleTapMessageProp(message, handleReactionDoubleTap);
    }
  };

  const messageContext = useCreateMessageContext({
    actionsEnabled,
    alignment,
    animatedLongPress,
    canModifyMessage,
    files: attachments.files,
    groupStyles: forwardedGroupStyles,
    handleAction,
    hasReactions,
    images: attachments.images,
    isMyMessage,
    lastGroupMessage:
      forwardedGroupStyles[0] === 'single' ||
      forwardedGroupStyles[0] === 'bottom',
    lastReceivedId,
    message,
    messageContentOrder,
    onLongPress: animatedLongPress
      ? (event) => {
          if (onLongPressMessageProp) {
            onLongPressMessageProp(event);
          }
        }
      : (event) => {
          if (onLongPressMessageProp) {
            onLongPressMessageProp(event);
          }
          onLongPressMessage(event);
        },
    onlyEmojis,
    onOpenThread,
    onPress: onPressProp
      ? (event: GestureResponderEvent) => onPressProp(message, event)
      : () => onPress(),
    otherAttachments: attachments.other,
    preventPress,
    reactions,
    showAvatar,
    showMessageOverlay,
    showMessageStatus:
      typeof showMessageStatus === 'boolean' ? showMessageStatus : isMyMessage,
    threadList,
  });

  const onLongPressTouchable = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>(
    {
      onFinish: () => {
        pressActive.value = false;
        cancelAnimation(scale);
        scale.value = withTiming(1, { duration: 100 });
      },
      onStart: () => {
        pressActive.value = true;
        cancelAnimation(scale);
        /**
         * React native longPress active occurs on 370ms,
         * to hijack this we must make sure the timing is
         * longer, otherwise onPress will fire instead
         */
        scale.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0.98, { duration: 400 }, () => {
            if (pressActive.value) {
              runOnJS(triggerHaptic)('impactMedium');
              runOnJS(onLongPressMessage)();
            }
          }),
          withTiming(1.02, { duration: 100 }),
          withTiming(1.0, { duration: 300 }),
        );
      },
    },
    [onLongPressMessage],
  );

  const onDoubleTap = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>(
    {
      onActive: () => {
        pressActive.value = false;
        cancelAnimation(scale);
        scale.value = withTiming(1, { duration: 100 });
        runOnJS(onDoubleTapMessage)();
      },
    },
    [onDoubleTapMessage],
  );

  return message.deleted_at || messageContentOrder.length ? (
    <TapGestureHandler
      enabled={animatedLongPress}
      maxDurationMs={3000}
      onGestureEvent={animatedLongPress ? onLongPressTouchable : undefined}
      waitFor={doubleTapRef}
    >
      <Animated.View>
        <TapGestureHandler
          numberOfTaps={2}
          onGestureEvent={onDoubleTap}
          ref={doubleTapRef}
        >
          <Animated.View
            style={[
              style,
              {
                backgroundColor: showUnreadUnderlay
                  ? bg_gradient_start
                  : undefined,
              },
              scaleStyle,
            ]}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                targetedMessageUnderlay,
                { backgroundColor: targetedMessageBackground },
                targetedStyle,
              ]}
            />
            <MessageProvider value={messageContext}>
              <MessageSimple />
            </MessageProvider>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  ) : null;
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel: prevChannel,
    lastReceivedId: prevLastReceivedId,
    message: prevMessage,
    showUnreadUnderlay: prevShowUnreadUnderlay,
    t: prevT,
    targetedMessage: prevTargetedMessage,
  } = prevProps;
  const {
    channel: nextChannel,
    lastReceivedId: nextLastReceivedId,
    message: nextMessage,
    showUnreadUnderlay: nextShowUnreadUnderlay,
    t: nextT,
    targetedMessage: nextTargetedMessage,
  } = nextProps;

  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!repliesEqual) return false;

  const lastReceivedIdChangedAndMatters =
    prevLastReceivedId !== nextLastReceivedId &&
    (prevLastReceivedId === prevMessage.id ||
      prevLastReceivedId === nextMessage.id ||
      nextLastReceivedId === prevMessage.id ||
      nextLastReceivedId === nextMessage.id);
  if (lastReceivedIdChangedAndMatters) return false;

  const messageEqual =
    prevMessage.deleted_at === nextMessage.deleted_at &&
    prevMessage.readBy === nextMessage.readBy &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.updated_at === nextMessage.updated_at;
  if (!messageEqual) return false;

  const messageUserBannedEqual =
    prevMessage.user?.banned === nextMessage.user?.banned;
  if (!messageUserBannedEqual) return false;

  const prevMessageAttachments = prevMessage.attachments;
  const nextMessageAttachments = nextMessage.attachments;
  const attachmentsEqual =
    (Array.isArray(prevMessageAttachments) &&
      Array.isArray(nextMessageAttachments) &&
      prevMessageAttachments.length === nextMessageAttachments.length &&
      prevMessageAttachments.every((attachment, index) =>
        attachment.type === 'image'
          ? attachment.image_url === nextMessageAttachments[index].image_url &&
            attachment.thumb_url === nextMessageAttachments[index].thumb_url
          : attachment.type === nextMessageAttachments[index].type,
      )) ||
    prevMessageAttachments === nextMessageAttachments;
  if (!attachmentsEqual) return false;

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) &&
    Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length ===
          nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) =>
            type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) return false;

  const mutedUserSame =
    !!prevChannel &&
    !!nextChannel &&
    prevChannel.state.mutedUsers.length === nextChannel.state.mutedUsers.length;
  if (!mutedUserSame) return false;

  const showUnreadUnderlayEqual =
    prevShowUnreadUnderlay === nextShowUnreadUnderlay;
  if (!showUnreadUnderlayEqual) return false;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const targetedMessageEqual = prevTargetedMessage === nextTargetedMessage;
  if (!targetedMessageEqual) return false;

  return true;
};

const MemoizedMessage = React.memo(
  MessageWithContext,
  areEqual,
) as typeof MessageWithContext;

export type MessageProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<
    MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'groupStyles' | 'message'
  >
> &
  Pick<
    MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'groupStyles' | 'message'
  >;

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./Message.md
 */
export const Message = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    disabled,
    enforceUniqueReaction,
    isAdmin,
    isModerator,
    isOwner,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { dismissKeyboard } = useKeyboardContext();
  const { setData } = useMessageOverlayContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    dismissKeyboardOnMessageTouch,
    messageContentOrder,
    MessageSimple,
    onDoubleTapMessage,
    onLongPressMessage,
    OverlayReactionList,
    reactionsEnabled,
    removeMessage,
    repliesEnabled,
    retrySendMessage,
    setEditingState,
    setQuotedMessageState,
    supportedReactions,
    updateMessage,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setOverlay } = useOverlayContext();
  const { openThread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  return (
    <MemoizedMessage<At, Ch, Co, Ev, Me, Re, Us>
      {...{
        channel,
        client,
        disabled,
        dismissKeyboard,
        dismissKeyboardOnMessageTouch,
        enforceUniqueReaction,
        isAdmin,
        isModerator,
        isOwner,
        messageContentOrder,
        MessageSimple,
        onDoubleTapMessage,
        onLongPressMessage,
        openThread,
        OverlayReactionList,
        reactionsEnabled,
        removeMessage,
        repliesEnabled,
        retrySendMessage,
        setData,
        setEditingState,
        setOverlay,
        setQuotedMessageState,
        supportedReactions,
        t,
        updateMessage,
      }}
      {...props}
    />
  );
};
