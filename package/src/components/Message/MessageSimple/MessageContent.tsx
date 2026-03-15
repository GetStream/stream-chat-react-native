import React, { useMemo } from 'react';
import {
  AnimatableNumericValue,
  ColorValue,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { MessageTextContainer } from './MessageTextContainer';

import { useChatContext } from '../../../contexts';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useMessageListItemContext } from '../../../contexts/messageListItemContext/MessageListItemContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import { components, primitives } from '../../../theme';
import { FileTypes } from '../../../types/types';
import { checkMessageEquality, checkQuotedMessageEquality } from '../../../utils/utils';
import { Poll } from '../../Poll/Poll';
import { useMessageData } from '../hooks/useMessageData';

const useReplyStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { isMyMessage } = useMessageContext();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        minWidth: 256, // TODO: Not sure how to fix this
        backgroundColor: isMyMessage
          ? semantics.chatBgAttachmentOutgoing
          : semantics.chatBgAttachmentIncoming,
        paddingLeft: primitives.spacingSm,
      },
      leftContainer: {
        borderLeftColor: isMyMessage
          ? semantics.chatReplyIndicatorOutgoing
          : semantics.chatReplyIndicatorIncoming,
      },
    });
  }, [semantics, isMyMessage]);
};

export type MessageContentPropsWithContext = Pick<
  MessageContextValue,
  | 'goToMessage'
  | 'groupStyles'
  | 'isMyMessage'
  | 'message'
  | 'messageContentOrder'
  | 'onLongPress'
  | 'onPress'
  | 'onPressIn'
  | 'otherAttachments'
  | 'preventPress'
  | 'threadList'
  | 'isMessageAIGenerated'
> &
  Pick<
    MessagesContextValue,
    | 'additionalPressableProps'
    | 'Attachment'
    | 'enableMessageGroupingByUser'
    | 'FileAttachmentGroup'
    | 'Gallery'
    | 'isAttachmentEqual'
    | 'MessageLocation'
    | 'myMessageTheme'
    | 'Reply'
    | 'StreamingMessageView'
  > &
  Pick<TranslationContextValue, 't'> & {
    setMessageContentWidth: React.Dispatch<React.SetStateAction<number>>;
    /**
     * Background color for the message content
     */
    backgroundColor?: ColorValue;
    /**
     * If the message is the very last message in the message list
     */
    isVeryLastMessage?: boolean;
    /**
     * If the message has no border radius
     */
    noBorder?: boolean;
    /**
     * If the message is grouped in a single or bottom container
     */
    messageGroupedSingleOrBottom?: boolean;

    /**
     * If the message has a single file
     */
    isSingleFile?: boolean;
    hidePaddingTop?: boolean;
    hidePaddingHorizontal?: boolean;
    hidePaddingBottom?: boolean;
    isMessageReceivedOrErrorType?: boolean;
  };

/**
 * Child of MessageSimple that displays a message's content
 */
const MessageContentWithContext = (props: MessageContentPropsWithContext) => {
  const {
    additionalPressableProps,
    Attachment,
    backgroundColor,
    enableMessageGroupingByUser,
    FileAttachmentGroup,
    Gallery,
    groupStyles,
    isMessageAIGenerated,
    isMyMessage,
    isMessageReceivedOrErrorType,
    isVeryLastMessage,
    message,
    messageContentOrder,
    messageGroupedSingleOrBottom = false,
    MessageLocation,
    noBorder,
    onLongPress,
    onPress,
    onPressIn,
    otherAttachments,
    preventPress,
    Reply,
    setMessageContentWidth,
    StreamingMessageView,
    hidePaddingTop,
    hidePaddingHorizontal,
    hidePaddingBottom,
  } = props;
  const { client } = useChatContext();
  const { PollContent: PollContentOverride } = useMessagesContext();
  const replyStyles = useReplyStyles();

  const {
    theme: {
      colors: { grey_whisper },
      messageSimple: {
        content: {
          container: {
            borderBottomLeftRadius,
            borderBottomRightRadius,
            borderRadius,
            borderTopLeftRadius,
            borderTopRightRadius,
            ...container
          },
          containerInner,
          contentContainer,
          lastMessageContainer,
          messageGroupedSingleOrBottomContainer,
          messageGroupedTopContainer,
          replyContainer,
          wrapper,
        },
      },
    },
  } = useTheme();

  const onLayout: (event: LayoutChangeEvent) => void = ({
    nativeEvent: {
      layout: { width },
    },
  }) => {
    setMessageContentWidth(width);
  };

  const isAIGenerated = useMemo(
    () => isMessageAIGenerated(message),
    [message, isMessageAIGenerated],
  );

  const getBorderRadius = () => {
    // enum('top', 'middle', 'bottom', 'single')
    const groupPosition = groupStyles?.[0];

    const isBottomOrSingle = groupPosition === 'single' || groupPosition === 'bottom';
    let borderBottomLeftRadius = components.messageBubbleRadiusGroupBottom;
    let borderBottomRightRadius = components.messageBubbleRadiusGroupBottom;

    if (isBottomOrSingle) {
      // add relevant sharp corner
      if (isMyMessage) {
        borderBottomRightRadius = components.messageBubbleRadiusTail;
      } else {
        borderBottomLeftRadius = components.messageBubbleRadiusTail;
      }
    }

    return {
      borderBottomLeftRadius,
      borderBottomRightRadius,
    };
  };

  const getBorderRadiusFromTheme = () => {
    const bordersFromTheme: Record<string, string | AnimatableNumericValue | undefined> = {
      borderBottomLeftRadius,
      borderBottomRightRadius,
      borderRadius,
      borderTopLeftRadius,
      borderTopRightRadius,
    };

    // filter out undefined values
    for (const key in bordersFromTheme) {
      if (bordersFromTheme[key] === undefined) {
        delete bordersFromTheme[key];
      }
    }

    return bordersFromTheme;
  };

  const { setNativeScrollability } = useMessageListItemContext();

  return (
    <Pressable
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            emitter: 'messageContent',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            emitter: 'messageContent',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            emitter: 'messageContent',
            event,
          });
        }
      }}
      style={container}
      {...additionalPressableProps}
      onPressOut={(event) => {
        setNativeScrollability(true);

        if (additionalPressableProps?.onPressOut) {
          additionalPressableProps.onPressOut(event);
        }
      }}
    >
      <View onLayout={onLayout} style={wrapper}>
        <View
          style={[
            styles.containerInner,
            {
              backgroundColor,
              borderColor: isMessageReceivedOrErrorType ? grey_whisper : backgroundColor,
              ...getBorderRadius(),
              ...getBorderRadiusFromTheme(),
            },
            noBorder ? { borderWidth: 0 } : {},
            containerInner,
            messageGroupedSingleOrBottom
              ? isVeryLastMessage && enableMessageGroupingByUser
                ? lastMessageContainer
                : messageGroupedSingleOrBottomContainer
              : messageGroupedTopContainer,
          ]}
          testID='message-content-wrapper'
        >
          <View
            style={[
              {
                gap: primitives.spacingXs,
                paddingTop: hidePaddingTop ? 0 : primitives.spacingXs,
                paddingHorizontal: hidePaddingHorizontal ? 0 : primitives.spacingXs,
                paddingBottom: hidePaddingBottom ? 0 : primitives.spacingXs,
              },
              contentContainer,
            ]}
          >
            {messageContentOrder.map((messageContentType, messageContentOrderIndex) => {
              switch (messageContentType) {
                case 'quoted_reply':
                  return (
                    message.quoted_message && (
                      <View
                        key={`quoted_reply_${messageContentOrderIndex}`}
                        style={[styles.replyContainer, replyContainer]}
                      >
                        <Reply mode='reply' styles={replyStyles} />
                      </View>
                    )
                  );
                case 'attachments':
                  return otherAttachments.map((attachment, attachmentIndex) => (
                    <Attachment attachment={attachment} key={`${message.id}-${attachmentIndex}`} />
                  ));
                case 'files':
                  return (
                    <FileAttachmentGroup
                      key={`file_attachment_group_${messageContentOrderIndex}`}
                    />
                  );
                case 'gallery':
                  return (
                    <View
                      key={`gallery_${messageContentOrderIndex}`}
                      style={styles.galleryContainer}
                    >
                      <Gallery />
                    </View>
                  );
                case 'poll': {
                  const pollId = message.poll_id;
                  const poll = pollId && client.polls.fromState(pollId);
                  return pollId && poll ? (
                    <Poll
                      key={`poll_${message.poll_id}`}
                      message={message}
                      poll={poll}
                      PollContent={PollContentOverride}
                    />
                  ) : null;
                }
                case 'location':
                  return MessageLocation ? (
                    <MessageLocation
                      key={`message_location_${messageContentOrderIndex}`}
                      message={message}
                    />
                  ) : null;
                case 'ai_text':
                  return isAIGenerated ? (
                    <StreamingMessageView
                      key={`ai_message_text_container_${messageContentOrderIndex}`}
                    />
                  ) : null;
                default:
                  return null;
              }
            })}
          </View>
          {(otherAttachments.length && otherAttachments[0].actions) || isAIGenerated ? null : (
            <MessageTextContainer />
          )}
        </View>
      </View>
    </Pressable>
  );
};

const areEqual = (
  prevProps: MessageContentPropsWithContext,
  nextProps: MessageContentPropsWithContext,
) => {
  const {
    backgroundColor: prevBackgroundColor,
    preventPress: prevPreventPress,
    goToMessage: prevGoToMessage,
    groupStyles: prevGroupStyles,
    isAttachmentEqual,
    message: prevMessage,
    messageContentOrder: prevMessageContentOrder,
    myMessageTheme: prevMyMessageTheme,
    otherAttachments: prevOtherAttachments,
    t: prevT,
  } = prevProps;
  const {
    backgroundColor: nextBackgroundColor,
    preventPress: nextPreventPress,
    goToMessage: nextGoToMessage,
    groupStyles: nextGroupStyles,
    message: nextMessage,
    messageContentOrder: nextMessageContentOrder,
    myMessageTheme: nextMyMessageTheme,
    otherAttachments: nextOtherAttachments,
    t: nextT,
  } = nextProps;

  if (prevBackgroundColor !== nextBackgroundColor) {
    return false;
  }

  if (prevPreventPress !== nextPreventPress) {
    return false;
  }

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;
  if (goToMessageChangedAndMatters) {
    return false;
  }

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length === nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) {
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

  const quotedMessageEqual = checkQuotedMessageEquality(
    prevMessage.quoted_message,
    nextMessage.quoted_message,
  );

  if (!quotedMessageEqual) {
    return false;
  }

  const prevMessageAttachments = prevMessage.attachments;
  const nextMessageAttachments = nextMessage.attachments;
  const attachmentsEqual =
    Array.isArray(prevMessageAttachments) && Array.isArray(nextMessageAttachments)
      ? prevMessageAttachments.length === nextMessageAttachments.length &&
        prevMessageAttachments.every((attachment, index) => {
          const attachmentKeysEqual =
            attachment.image_url === nextMessageAttachments[index].image_url &&
            attachment.og_scrape_url === nextMessageAttachments[index].og_scrape_url &&
            attachment.thumb_url === nextMessageAttachments[index].thumb_url &&
            attachment.type === nextMessageAttachments[index].type;

          if (isAttachmentEqual) {
            return (
              attachmentKeysEqual && !!isAttachmentEqual(attachment, nextMessageAttachments[index])
            );
          }

          return attachmentKeysEqual;
        })
      : prevMessageAttachments === nextMessageAttachments;
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

  const messageContentOrderEqual =
    prevMessageContentOrder.length === nextMessageContentOrder.length &&
    prevMessageContentOrder.every(
      (messageContentType, index) => messageContentType === nextMessageContentOrder[index],
    );
  if (!messageContentOrderEqual) {
    return false;
  }

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
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

const MemoizedMessageContent = React.memo(
  MessageContentWithContext,
  areEqual,
) as typeof MessageContentWithContext;

export type MessageContentProps = Partial<
  Omit<MessageContentPropsWithContext, 'setMessageContentWidth'>
> &
  Pick<MessageContentPropsWithContext, 'setMessageContentWidth'>;

/**
 * Child of MessageSimple that displays a message's content
 */
export const MessageContent = (props: MessageContentProps) => {
  const {
    goToMessage,
    groupStyles,
    isMessageAIGenerated,
    isMyMessage,
    message,
    messageContentOrder,
    onLongPress,
    onPress,
    onPressIn,
    otherAttachments,
    preventPress,
    threadList,
    files,
    images,
    videos,
  } = useMessageContext();
  const {
    additionalPressableProps,
    Attachment,
    enableMessageGroupingByUser,
    FileAttachmentGroup,
    Gallery,
    isAttachmentEqual,
    MessageLocation,
    myMessageTheme,
    Reply,
    StreamingMessageView,
  } = useMessagesContext();
  const { t } = useTranslationContext();
  const isSingleFile = files.length === 1;
  const messageHasPoll = messageContentOrder.includes('poll');
  const messageHasSingleMedia =
    messageContentOrder.length === 1 &&
    messageContentOrder.includes('gallery') &&
    images.length + videos.length === 1;
  const messageHasSingleFile =
    messageContentOrder.length === 1 && messageContentOrder[0] === 'files' && isSingleFile;
  const messageHasOnlyText = messageContentOrder.length === 1 && messageContentOrder[0] === 'text';
  const messageHasGiphyOrImgur =
    otherAttachments.filter(
      (file) => file.type === FileTypes.Giphy || file.type === FileTypes.Imgur,
    ).length > 0;

  const hidePaddingTop =
    messageHasPoll ||
    messageHasSingleMedia ||
    messageHasSingleFile ||
    messageHasOnlyText ||
    messageHasGiphyOrImgur;

  const hidePaddingHorizontal =
    messageHasPoll || messageHasSingleMedia || messageHasSingleFile || messageHasGiphyOrImgur;

  const hidePaddingBottom =
    messageHasPoll ||
    messageHasSingleMedia ||
    messageHasSingleFile ||
    messageHasOnlyText ||
    messageHasGiphyOrImgur ||
    (messageContentOrder.length > 1 &&
      messageContentOrder[messageContentOrder.length - 1] === 'text');

  const { isMessageReceivedOrErrorType } = useMessageData({});

  return (
    <MemoizedMessageContent
      {...{
        additionalPressableProps,
        Attachment,
        enableMessageGroupingByUser,
        isMessageReceivedOrErrorType,
        FileAttachmentGroup,
        Gallery,
        goToMessage,
        groupStyles,
        isAttachmentEqual,
        isMessageAIGenerated,
        isMyMessage,
        message,
        messageContentOrder,
        MessageLocation,
        myMessageTheme,
        onLongPress,
        onPress,
        onPressIn,
        otherAttachments,
        preventPress,
        Reply,
        StreamingMessageView,
        t,
        threadList,
        hidePaddingTop,
        hidePaddingHorizontal,
        hidePaddingBottom,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
  },
  containerInner: {
    borderTopLeftRadius: components.messageBubbleRadiusGroupBottom,
    borderTopRightRadius: components.messageBubbleRadiusGroupBottom,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leftAlignContent: {
    justifyContent: 'flex-start',
  },
  leftAlignItems: {
    alignItems: 'flex-start',
  },
  replyBorder: {
    borderLeftWidth: 1,
    bottom: 0,
    position: 'absolute',
  },
  replyContainer: {
    alignSelf: 'center',
  },
  galleryContainer: {},
  rightAlignContent: {
    justifyContent: 'flex-end',
  },
  rightAlignItems: {
    alignItems: 'flex-end',
  },
  textWrapper: {},
});
