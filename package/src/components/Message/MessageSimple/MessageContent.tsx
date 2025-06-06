import React, { useMemo } from 'react';
import {
  AnimatableNumericValue,
  ColorValue,
  DimensionValue,
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
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import { useViewport } from '../../../hooks/useViewport';

import { checkMessageEquality, checkQuotedMessageEquality } from '../../../utils/utils';
import { Poll } from '../../Poll/Poll';
import { useMessageData } from '../hooks/useMessageData';

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
  },
  containerInner: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  rightAlignContent: {
    justifyContent: 'flex-end',
  },
  rightAlignItems: {
    alignItems: 'flex-end',
  },
});

export type MessageContentPropsWithContext = Pick<
  MessageContextValue,
  | 'alignment'
  | 'goToMessage'
  | 'groupStyles'
  | 'isEditedMessageOpen'
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
    | 'MessageError'
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
  };

/**
 * Child of MessageSimple that displays a message's content
 */
const MessageContentWithContext = (props: MessageContentPropsWithContext) => {
  const {
    additionalPressableProps,
    alignment,
    Attachment,
    backgroundColor,
    enableMessageGroupingByUser,
    FileAttachmentGroup,
    Gallery,
    groupStyles,
    isMessageAIGenerated,
    isMyMessage,
    isVeryLastMessage,
    message,
    messageContentOrder,
    messageGroupedSingleOrBottom = false,
    MessageError,
    noBorder,
    onLongPress,
    onPress,
    onPressIn,
    otherAttachments,
    preventPress,
    Reply,
    setMessageContentWidth,
    StreamingMessageView,
    threadList,
  } = props;
  const { client } = useChatContext();
  const { PollContent: PollContentOverride } = useMessagesContext();

  const {
    theme: {
      colors: { grey_whisper, light_gray },
      messageSimple: {
        content: {
          container: {
            borderBottomLeftRadius,
            borderBottomRightRadius,
            borderRadius,
            borderRadiusL,
            borderRadiusS,
            borderTopLeftRadius,
            borderTopRightRadius,
            ...container
          },
          containerInner,
          lastMessageContainer,
          messageGroupedSingleOrBottomContainer,
          messageGroupedTopContainer,
          replyBorder,
          replyContainer,
          wrapper,
        },
      },
    },
  } = useTheme();
  const { vw } = useViewport();

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

  const { hasThreadReplies, isMessageErrorType, isMessageReceivedOrErrorType } = useMessageData({});

  const repliesCurveColor = !isMessageReceivedOrErrorType ? backgroundColor : light_gray;

  const getBorderRadius = () => {
    // enum('top', 'middle', 'bottom', 'single')
    const groupPosition = groupStyles?.[0];

    const isBottomOrSingle = groupPosition === 'single' || groupPosition === 'bottom';
    let borderBottomLeftRadius = borderRadiusL;
    let borderBottomRightRadius = borderRadiusL;

    if (isBottomOrSingle && (!hasThreadReplies || threadList)) {
      // add relevant sharp corner
      if (isMyMessage) {
        borderBottomRightRadius = borderRadiusS;
      } else {
        borderBottomLeftRadius = borderRadiusS;
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
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, container]}
      {...additionalPressableProps}
    >
      <View onLayout={onLayout} style={wrapper}>
        {hasThreadReplies && !threadList && !noBorder && (
          <View
            style={[
              styles.replyBorder,
              {
                borderColor: repliesCurveColor,
                height: borderRadiusL as DimensionValue | undefined,
                left: alignment === 'left' ? 0 : undefined,
                right: alignment === 'right' ? 0 : undefined,
              },
              replyBorder,
            ]}
          />
        )}
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
          {messageContentOrder.map((messageContentType, messageContentOrderIndex) => {
            switch (messageContentType) {
              case 'quoted_reply':
                return (
                  message.quoted_message && (
                    <View
                      key={`quoted_reply_${messageContentOrderIndex}`}
                      style={[styles.replyContainer, replyContainer]}
                    >
                      <Reply styles={{ messageContainer: { maxWidth: vw(60) } }} />
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
                    messageId={message.id}
                  />
                );
              case 'gallery':
                return <Gallery key={`gallery_${messageContentOrderIndex}`} />;
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
              case 'ai_text':
                return isAIGenerated ? (
                  <StreamingMessageView
                    key={`ai_message_text_container_${messageContentOrderIndex}`}
                  />
                ) : null;
              case 'text':
              default:
                return (otherAttachments.length && otherAttachments[0].actions) ||
                  isAIGenerated ? null : (
                  <MessageTextContainer
                    key={`message_text_container_${messageContentOrderIndex}`}
                  />
                );
            }
          })}
        </View>
        {isMessageErrorType && <MessageError />}
      </View>
    </Pressable>
  );
};

const areEqual = (
  prevProps: MessageContentPropsWithContext,
  nextProps: MessageContentPropsWithContext,
) => {
  const {
    goToMessage: prevGoToMessage,
    groupStyles: prevGroupStyles,
    isAttachmentEqual,
    isEditedMessageOpen: prevIsEditedMessageOpen,
    message: prevMessage,
    messageContentOrder: prevMessageContentOrder,
    myMessageTheme: prevMyMessageTheme,
    otherAttachments: prevOtherAttachments,
    t: prevT,
  } = prevProps;
  const {
    goToMessage: nextGoToMessage,
    groupStyles: nextGroupStyles,
    isEditedMessageOpen: nextIsEditedMessageOpen,
    message: nextMessage,
    messageContentOrder: nextMessageContentOrder,
    myMessageTheme: nextMyMessageTheme,
    otherAttachments: nextOtherAttachments,
    t: nextT,
  } = nextProps;

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;
  if (goToMessageChangedAndMatters) {
    return false;
  }

  const isEditedMessageOpenEqual = prevIsEditedMessageOpen === nextIsEditedMessageOpen;
  if (!isEditedMessageOpenEqual) {
    return false;
  }

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length === nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) {
    return false;
  }

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length &&
    prevGroupStyles?.[0] === nextGroupStyles?.[0];
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
    alignment,
    goToMessage,
    groupStyles,
    isEditedMessageOpen,
    isMessageAIGenerated,
    isMyMessage,
    lastReceivedId,
    message,
    messageContentOrder,
    onLongPress,
    onPress,
    onPressIn,
    otherAttachments,
    preventPress,
    threadList,
  } = useMessageContext();
  const {
    additionalPressableProps,
    Attachment,
    enableMessageGroupingByUser,
    FileAttachmentGroup,
    Gallery,
    isAttachmentEqual,
    MessageError,
    myMessageTheme,
    Reply,
    StreamingMessageView,
  } = useMessagesContext();
  const { t } = useTranslationContext();

  return (
    <MemoizedMessageContent
      {...{
        additionalPressableProps,
        alignment,
        Attachment,
        enableMessageGroupingByUser,
        FileAttachmentGroup,
        Gallery,
        goToMessage,
        groupStyles,
        isAttachmentEqual,
        isEditedMessageOpen,
        isMessageAIGenerated,
        isMyMessage,
        lastReceivedId,
        message,
        messageContentOrder,
        MessageError,
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
      }}
      {...props}
    />
  );
};
