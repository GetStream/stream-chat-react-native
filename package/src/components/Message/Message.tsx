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
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler';
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
import { messageActions as defaultMessageActions } from './utils/messageActions';
import { removeReservedFields } from './utils/removeReservedFields';

import {
  isMessageWithStylesReadByAndDateSeparator,
  MessageType,
} from '../MessageList/hooks/useMessageList';

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
  MessageAction,
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
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useToastContext } from '../../contexts/toastContext/ToastContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
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
import { StreamCache } from '../../StreamCache';
import { emojiRegex } from '../../utils/utils';

import type { Attachment, MessageResponse, Reaction } from 'stream-chat';

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

const prefetchImage = ({ height, url }: { height: number | string; url: string }) => {
  if (url.includes('&h=%2A')) {
    Image.prefetch(
      url.replace('h=%2A', `h=${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`),
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = TouchableHandlerPayload & {
  actionHandlers?: MessageActionHandlers;
  message?: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
};

export type MessageActionHandlers = {
  deleteMessage: () => Promise<void>;
  editMessage: () => void;
  quotedReply: () => void;
  resendMessage: () => Promise<void>;
  showMessageOverlay: () => void;
  toggleBanUser: () => Promise<void>;
  toggleMuteUser: () => Promise<void>;
  toggleReaction: (reactionType: string) => Promise<void>;
};

export type MessagePropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<
  ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'channel'
  | 'disabled'
  | 'enforceUniqueReaction'
  | 'isAdmin'
  | 'isModerator'
  | 'members'
  | 'readEventsEnabled'
> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client' | 'mutedUsers'> &
  Pick<KeyboardContextValue, 'dismissKeyboard'> &
  Partial<Omit<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'groupStyles' | 'message'>> &
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'groupStyles' | 'message'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'animatedLongPress'
    | 'blockUser'
    | 'copyMessage'
    | 'deleteMessage'
    | 'dismissKeyboardOnMessageTouch'
    | 'editMessage'
    | 'flagMessage'
    | 'forceAlignMessages'
    | 'handleBlock'
    | 'handleCopy'
    | 'handleDelete'
    | 'handleEdit'
    | 'handleFlag'
    | 'handleMute'
    | 'handleQuotedReply'
    | 'handleReaction'
    | 'handleRetry'
    | 'handleThreadReply'
    | 'messageActions'
    | 'messageContentOrder'
    | 'MessageSimple'
    | 'mutesEnabled'
    | 'muteUser'
    | 'onDoubleTapMessage'
    | 'onLongPressMessage'
    | 'onPressInMessage'
    | 'onPressMessage'
    | 'OverlayReactionList'
    | 'quotedRepliesEnabled'
    | 'quotedReply'
    | 'reactionsEnabled'
    | 'removeMessage'
    | 'retry'
    | 'retrySendMessage'
    | 'selectReaction'
    | 'setEditingState'
    | 'setQuotedMessageState'
    | 'supportedReactions'
    | 'threadRepliesEnabled'
    | 'threadReply'
    | 'updateMessage'
  > &
  Pick<MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'setData'> &
  Pick<OverlayContextValue, 'setOverlay'> &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'openThread'> &
  Pick<TranslationContextValue, 't'> & {
    messagesContext: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>;
    /**
     * Whether or not users are able to long press messages.
     */
    enableLongPress?: boolean;
    goToMessage?: (messageId: string) => void;
    /**
     * Array of allowed actions or null on message, this can also be a function returning the array.
     * If all the actions need to be disabled an empty array should be provided as value of prop
     */
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
      payload: Partial<MessageTouchableHandlerPayload<At, Ch, Co, Ev, Me, Re, Us>>,
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
      payload: Partial<MessageTouchableHandlerPayload<At, Ch, Co, Ev, Me, Re, Us>>,
    ) => void;

    onPressIn?: (
      payload: Partial<MessageTouchableHandlerPayload<At, Ch, Co, Ev, Me, Re, Us>>,
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
  Us extends UnknownType = DefaultUserType,
>(
  props: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    animatedLongPress = Platform.OS === 'ios' && !props.message.deleted_at,
    blockUser: blockUserProp,
    channel,
    client,
    copyMessage: copyMessageProp,
    deleteMessage: deleteMessageProp,
    disabled,
    dismissKeyboard,
    dismissKeyboardOnMessageTouch,
    editMessage: editMessageProp,
    enableLongPress = true,
    enforceUniqueReaction,
    flagMessage: flagMessageProp,
    forceAlignMessages = false,
    goToMessage,
    groupStyles = ['bottom'],
    handleBlock,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMute,
    handleQuotedReply,
    handleReaction: handleReactionProp,
    handleRetry,
    handleThreadReply,
    isAdmin,
    isModerator,
    lastReceivedId,
    members,
    message,
    messageActions: messageActionsProp = defaultMessageActions,
    messageContentOrder: messageContentOrderProp,
    messagesContext,
    MessageSimple,
    mutesEnabled,
    muteUser: muteUserProp,
    onDoubleTapMessage: onDoubleTapMessageProp,
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
    quotedRepliesEnabled,
    reactionsEnabled,
    readEventsEnabled,
    removeMessage,
    quotedReply: quotedReplyProp,
    retry: retryProp,
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
    targetedMessage,
    threadList = false,
    threadRepliesEnabled,
    threadReply: threadReplyProp,
    updateMessage,
  } = props;

  const toast = useToastContext();

  const {
    theme: {
      colors: { accent_blue, accent_red, bg_gradient_start, grey, targetedMessageBackground },
      messageSimple: {
        gallery: { halfSize, size },
        targetedMessageUnderlay,
      },
    },
  } = useTheme();

  const doubleTapRef = useRef<TapGestureHandler>(null);
  const pressActive = useSharedValue(false);
  const scale = useSharedValue(1);

  /**
   * This is a cleanup effect to prevent the onLongPress
   * handler from being called if the component has dismounted.
   */
  useEffect(
    () => () => {
      pressActive.value = false;
      cancelAnimation(scale);
    },
    [],
  );
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

  const actionsEnabled = message.type === 'regular' && message.status === 'received';

  const isMyMessage = client && message && client.userID === message.user?.id;

  const canModifyMessage = isMyMessage || isModerator || isAdmin;

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

  const onPressQuotedMessage = (quotedMessage: MessageType<At, Ch, Co, Ev, Me, Re, Us>) => {
    if (!goToMessage) return;

    pressActive.value = false;
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: 100 });
    goToMessage(quotedMessage.id);
  };

  const onPress = (error = message.type === 'error' || message.status === 'failed') => {
    if (dismissKeyboardOnMessageTouch) {
      Keyboard.dismiss();
    }
    const quotedMessage = message.quoted_message as MessageType<At, Ch, Co, Ev, Me, Re, Us>;
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
    !message.deleted_at && Array.isArray(message.attachments)
      ? message.attachments.reduce(
          (acc, cur) => {
            if (cur.type === 'file') {
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
    message.attachments.some((attachment) => attachment.actions && attachment.actions.length);

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
    !!reactionsEnabled &&
    !message.deleted_at &&
    !!message.latest_reactions &&
    message.latest_reactions.length > 0;

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

  const handleToggleReaction = async (reactionType: string) => {
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
            { enforce_unique: enforceUniqueReaction },
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleResendMessage = () =>
    retrySendMessage(message as MessageResponse<At, Ch, Co, Me, Re, Us>);

  const handleQuotedReplyMessage = () => {
    setQuotedMessageState(message);
  };

  const isMuted = (client.mutedUsers || []).some(
    (mute) => mute.user.id === client.userID && mute.target.id === message.user?.id,
  );

  const handleToggleMuteUser = async () => {
    if (!message.user?.id) {
      return;
    }

    if (isMuted) {
      await client.unmuteUser(message.user.id);
    } else {
      await client.muteUser(message.user.id);
    }
  };

  const handleDeleteMessage = async () => {
    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };

  const handleEditMessage = () => {
    setEditingState(message);
  };

  const handleToggleBanUser = async () => {
    const messageUser = message.user;
    if (!messageUser) {
      return;
    }

    if (messageUser.banned) {
      await client.unbanUser(messageUser.id);
    } else {
      await client.banUser(messageUser.id);
    }
  };

  const showMessageOverlay = async (
    messageReactions = false,
    error = message.type === 'error' || message.status === 'failed',
  ) => {
    await dismissKeyboard();

    const blockUser = blockUserProp
      ? blockUserProp(message)
      : blockUserProp === null
      ? null
      : {
          action: () => async () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              setOverlay('none');
              if (message.user?.id) {
                if (handleBlock) {
                  handleBlock(message);
                }

                await handleToggleBanUser();
              }
            }
          },
          icon: <UserDelete pathFill={grey} />,
          title: message.user?.banned ? t('Unblock User') : t('Block User'),
        };

    const copyMessage = copyMessageProp
      ? copyMessageProp(message)
      : copyMessageProp === null
      ? null
      : {
          // using depreciated Clipboard from react-native until expo supports the community version or their own
          action: () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              setOverlay('none');
              if (handleCopy) {
                handleCopy(message);
              }
              Clipboard.setString(message.text || '');
            }
          },
          icon: <Copy pathFill={grey} />,
          title: t('Copy Message'),
        };

    const deleteMessage = deleteMessageProp
      ? deleteMessageProp(message)
      : deleteMessageProp === null
      ? null
      : {
          action: () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
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
                        if (handleDelete) {
                          handleDelete(message);
                        }

                        await handleDeleteMessage();
                      },
                      style: 'destructive',
                      text: t('Delete'),
                    },
                  ],
                  { cancelable: false },
                );
              }
            }
          },
          icon: <Delete pathFill={accent_red} />,
          title: t('Delete Message'),
          titleStyle: { color: accent_red },
        };

    const editMessage = editMessageProp
      ? editMessageProp(message)
      : editMessageProp === null
      ? null
      : {
          action: () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              setOverlay('none');
              if (handleEdit) {
                handleEdit(message);
              }
              handleEditMessage();
            }
          },
          icon: <Edit pathFill={grey} />,
          title: t('Edit Message'),
        };

    const flagMessage = flagMessageProp
      ? flagMessageProp(message)
      : flagMessageProp === null
      ? null
      : {
          action: () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
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
                          if (handleFlag) {
                            handleFlag(message);
                          }
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
            }
          },
          icon: <MessageFlag pathFill={grey} />,
          title: t('Flag Message'),
        };

    const handleReaction = !error
      ? selectReaction
        ? selectReaction(message)
        : async (reactionType: string) => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              if (handleReactionProp) {
                handleReactionProp(message, reactionType);
              }

              await handleToggleReaction(reactionType);
            }
          }
      : undefined;

    const muteUser = muteUserProp
      ? muteUserProp(message)
      : muteUserProp === null
      ? null
      : {
          action: async () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              setOverlay('none');
              if (message.user?.id) {
                if (handleMute) {
                  handleMute(message);
                }

                await handleToggleMuteUser();
              }
            }
          },
          icon: <Mute pathFill={grey} />,
          title: isMuted ? t('Unmute User') : t('Mute User'),
        };

    const quotedReply = quotedReplyProp
      ? quotedReplyProp(message)
      : quotedReplyProp === null
      ? null
      : {
          action: () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              setOverlay('none');
              if (handleQuotedReply) {
                handleQuotedReply(message);
              }
              handleQuotedReplyMessage();
            }
          },
          icon: <CurveLineLeftUp pathFill={grey} />,
          title: t('Reply'),
        };

    const retry = retryProp
      ? retryProp(message)
      : retryProp === null
      ? null
      : {
          action: async () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              setOverlay('none');
              const messageWithoutReservedFields = removeReservedFields(message);
              if (handleRetry) {
                handleRetry(messageWithoutReservedFields);
              }

              await handleResendMessage();
            }
          },
          icon: <SendUp pathFill={accent_blue} />,
          title: t('Resend'),
        };

    const threadReply = threadReplyProp
      ? threadReplyProp(message)
      : threadReplyProp === null
      ? null
      : {
          action: () => {
            if (!StreamCache.getInstance().currentNetworkState) {
              toast.show(t('Something went wrong'), 2000);
            } else {
              setOverlay('none');
              if (handleThreadReply) {
                handleThreadReply(message);
              }
              onOpenThread();
            }
          },
          icon: <ThreadReply pathFill={grey} />,
          title: t('Thread Reply'),
        };

    const isThreadMessage = threadList || !!message.parent_id;

    const dismissOverlay = () => setOverlay('none');

    const messageActions =
      typeof messageActionsProp !== 'function'
        ? messageActionsProp
        : messageActionsProp({
            blockUser,
            canModifyMessage,
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
            mutesEnabled,
            muteUser,
            quotedRepliesEnabled,
            quotedReply,
            retry,
            threadRepliesEnabled,
            threadReply,
          });

    setData({
      alignment,
      clientId: client.userID,
      files: attachments.files,
      groupStyles,
      handleReaction: reactionsEnabled ? handleReaction : undefined,
      images: attachments.images,
      message,
      messageActions: messageActions?.filter(Boolean) as MessageAction[] | undefined,
      messageContext: { ...messageContext, disabled: true, preventPress: true },
      messageReactionTitle: !error && messageReactions ? t('Message Reactions') : undefined,
      messagesContext: { ...messagesContext, messageContentOrder },
      onlyEmojis,
      otherAttachments: attachments.other,
      OverlayReactionList,
      supportedReactions,
      threadList,
    });

    setOverlay('message');
  };

  const actionHandlers: MessageActionHandlers = {
    deleteMessage: handleDeleteMessage,
    editMessage: handleEditMessage,
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
      ? () => showMessageOverlay(false)
      : () => null;

  const onDoubleTapMessage = () => {
    if (onDoubleTapMessageProp) {
      onDoubleTapMessageProp({ actionHandlers, message });
    }
  };

  const messageContext = useCreateMessageContext({
    actionsEnabled,
    alignment,
    canModifyMessage,
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
    onLongPress: !animatedLongPress ? onLongPressMessage : () => null,
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
    readEventsEnabled,
    showAvatar,
    showMessageOverlay,
    showMessageStatus: typeof showMessageStatus === 'boolean' ? showMessageStatus : isMyMessage,
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
              runOnJS(onLongPressMessage)();
              runOnJS(triggerHaptic)('impactMedium');
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
      enabled={animatedLongPress && !preventPress}
      maxDeltaX={8}
      maxDurationMs={3000}
      onGestureEvent={animatedLongPress ? onLongPressTouchable : undefined}
      waitFor={doubleTapRef}
    >
      <Animated.View testID='message-wrapper'>
        <TapGestureHandler
          enabled={!preventPress}
          numberOfTaps={2}
          onGestureEvent={onDoubleTap}
          ref={doubleTapRef}
        >
          <Animated.View
            style={[
              style,
              {
                backgroundColor: showUnreadUnderlay ? bg_gradient_start : undefined,
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
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    goToMessage: prevGoToMessage,
    lastReceivedId: prevLastReceivedId,
    message: prevMessage,
    mutedUsers: prevMutedUsers,
    showUnreadUnderlay: prevShowUnreadUnderlay,
    t: prevT,
    targetedMessage: prevTargetedMessage,
  } = prevProps;
  const {
    goToMessage: nextGoToMessage,
    lastReceivedId: nextLastReceivedId,
    message: nextMessage,
    mutedUsers: nextMutedUsers,
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

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;

  if (goToMessageChangedAndMatters) return false;

  const messageEqual =
    prevMessage.deleted_at === nextMessage.deleted_at &&
    (isMessageWithStylesReadByAndDateSeparator(prevMessage) && prevMessage.readBy) ===
      (isMessageWithStylesReadByAndDateSeparator(nextMessage) && nextMessage.readBy) &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.updated_at === nextMessage.updated_at;

  if (!messageEqual) return false;

  const quotedMessageEqual =
    prevMessage.quoted_message?.id === nextMessage.quoted_message?.id &&
    prevMessage.quoted_message?.deleted_at === nextMessage.quoted_message?.deleted_at;

  if (!quotedMessageEqual) return false;

  const messageUserBannedEqual = prevMessage.user?.banned === nextMessage.user?.banned;
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

  const targetedMessageEqual = prevTargetedMessage === nextTargetedMessage;
  if (!targetedMessageEqual) return false;

  return true;
};

const MemoizedMessage = React.memo(MessageWithContext, areEqual) as typeof MessageWithContext;

export type MessageProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<Omit<MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'groupStyles' | 'message'>> &
  Pick<MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'groupStyles' | 'message'>;

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
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    disabled,
    enforceUniqueReaction,
    isAdmin,
    isModerator,
    members,
    readEventsEnabled,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, mutedUsers } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { dismissKeyboard } = useKeyboardContext();
  const { setData } = useMessageOverlayContext<At, Ch, Co, Ev, Me, Re, Us>();
  const messagesContext = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setOverlay } = useOverlayContext();
  const { openThread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  return (
    <MemoizedMessage<At, Ch, Co, Ev, Me, Re, Us>
      {...messagesContext}
      {...{
        channel,
        client,
        disabled,
        dismissKeyboard,
        enforceUniqueReaction,
        isAdmin,
        isModerator,
        members,
        messagesContext,
        mutedUsers,
        openThread,
        readEventsEnabled,
        setData,
        setOverlay,
        t,
      }}
      {...props}
    />
  );
};
