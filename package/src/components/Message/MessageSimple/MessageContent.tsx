import React from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';

import { MessageTextContainer } from './MessageTextContainer';

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
  isDayOrMoment,
  TDateTimeParserInput,
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import { Error } from '../../../icons';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageStatusTypes, vw } from '../../../utils/utils';

const styles = StyleSheet.create({
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

export type MessageContentPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatGenerics>,
  | 'alignment'
  | 'disabled'
  | 'goToMessage'
  | 'groupStyles'
  | 'hasReactions'
  | 'isMyMessage'
  | 'lastGroupMessage'
  | 'members'
  | 'message'
  | 'messageContentOrder'
  | 'onLongPress'
  | 'onlyEmojis'
  | 'onPress'
  | 'onPressIn'
  | 'otherAttachments'
  | 'preventPress'
  | 'showMessageStatus'
  | 'threadList'
> &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'additionalTouchableProps'
    | 'Attachment'
    | 'FileAttachmentGroup'
    | 'formatDate'
    | 'Gallery'
    | 'isAttachmentEqual'
    | 'MessageFooter'
    | 'MessageHeader'
    | 'MessageDeleted'
    | 'MessageReplies'
    | 'MessageStatus'
    | 'onPressInMessage'
    | 'Reply'
  > &
  Pick<TranslationContextValue, 't' | 'tDateTimeParser'> & {
    setMessageContentWidth: React.Dispatch<React.SetStateAction<number>>;
  };

/**
 * Child of MessageSimple that displays a message's content
 */
const MessageContentWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageContentPropsWithContext<StreamChatGenerics>,
) => {
  const {
    additionalTouchableProps,
    alignment,
    Attachment,
    disabled,
    FileAttachmentGroup,
    formatDate,
    Gallery,
    groupStyles,
    hasReactions,
    isMyMessage,
    lastGroupMessage,
    members,
    message,
    messageContentOrder,
    MessageDeleted,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageStatus,
    onLongPress,
    onlyEmojis,
    onPress,
    onPressIn,
    otherAttachments,
    preventPress,
    Reply,
    setMessageContentWidth,
    showMessageStatus,
    tDateTimeParser,
    threadList,
  } = props;

  const {
    theme: {
      colors: { accent_red, blue_alice, grey_gainsboro, grey_whisper, transparent, white },
      messageSimple: {
        content: {
          container: { borderRadiusL, borderRadiusS, ...container },
          containerInner,
          errorContainer,
          errorIcon,
          errorIconContainer,
          replyBorder,
          replyContainer,
          wrapper,
        },
        reactionList: { radius, reactionSize },
      },
    },
  } = useTheme();

  const getDateText = (formatter?: (date: TDateTimeParserInput) => string) => {
    if (!message.created_at) return '';

    if (formatter) {
      return formatter(message.created_at);
    }

    const parserOutput = tDateTimeParser(message.created_at);

    if (isDayOrMoment(parserOutput)) {
      return parserOutput.format('LT');
    }
    return message.created_at;
  };

  const onLayout: (event: LayoutChangeEvent) => void = ({
    nativeEvent: {
      layout: { width },
    },
  }) => {
    setMessageContentWidth(width);
  };

  const error = message.type === 'error' || message.status === MessageStatusTypes.FAILED;

  const groupStyle = `${alignment}_${groupStyles?.[0]?.toLowerCase?.()}`;

  const hasThreadReplies = !!message?.reply_count;

  let noBorder = onlyEmojis && !message.quoted_message;
  if (otherAttachments.length) {
    if (otherAttachments[0].type === 'giphy' && !isMyMessage) {
      noBorder = false;
    } else {
      noBorder = true;
    }
  }

  const isMessageTypeDeleted = message.type === 'deleted';

  if (isMessageTypeDeleted) {
    return (
      <MessageDeleted
        formattedDate={getDateText(formatDate)}
        groupStyle={groupStyle}
        noBorder={noBorder}
        onLayout={onLayout}
      />
    );
  }

  let backgroundColor = grey_gainsboro;
  if (onlyEmojis && !message.quoted_message) {
    backgroundColor = transparent;
  } else if (otherAttachments.length) {
    if (otherAttachments[0].type === 'giphy') {
      backgroundColor = message.quoted_message ? grey_gainsboro : transparent;
    } else {
      backgroundColor = blue_alice;
    }
  } else if (alignment === 'left' || error) {
    backgroundColor = white;
  }

  const repliesCurveColor = isMyMessage && !error ? backgroundColor : grey_whisper;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || preventPress}
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
      testID='message-content'
      {...additionalTouchableProps}
      /**
       * Border radii are useful for the case of error message types only.
       * Otherwise background is transparent, so border radius is not really visible.
       */
      style={[
        alignment === 'left' ? styles.leftAlignItems : styles.rightAlignItems,
        { paddingTop: hasReactions ? reactionSize / 2 + radius : 2 },
        error ? errorContainer : {},
        container,
      ]}
    >
      {MessageHeader && (
        <MessageHeader
          alignment={alignment}
          formattedDate={getDateText(formatDate)}
          isDeleted={!!isMessageTypeDeleted}
          lastGroupMessage={lastGroupMessage}
          members={members}
          message={message}
          MessageStatus={MessageStatus}
          otherAttachments={otherAttachments}
          showMessageStatus={showMessageStatus}
        />
      )}
      <View onLayout={onLayout} style={wrapper}>
        {hasThreadReplies && !threadList && !noBorder && (
          <View
            style={[
              styles.replyBorder,
              {
                borderColor: repliesCurveColor,
                height: borderRadiusL,
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
              borderBottomLeftRadius:
                (groupStyle === 'left_bottom' || groupStyle === 'left_single') &&
                (!hasThreadReplies || threadList)
                  ? borderRadiusS
                  : borderRadiusL,
              borderBottomRightRadius:
                (groupStyle === 'right_bottom' || groupStyle === 'right_single') &&
                (!hasThreadReplies || threadList)
                  ? borderRadiusS
                  : borderRadiusL,
              borderColor: isMyMessage && !error ? backgroundColor : grey_whisper,
            },
            noBorder ? { borderWidth: 0 } : {},
            containerInner,
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
              case 'text':
              default:
                return otherAttachments.length && otherAttachments[0].actions ? null : (
                  <MessageTextContainer<StreamChatGenerics>
                    key={`message_text_container_${messageContentOrderIndex}`}
                  />
                );
            }
          })}
        </View>
        {error && (
          <View style={StyleSheet.absoluteFill} testID='message-error'>
            <View style={errorIconContainer}>
              <Error pathFill={accent_red} {...errorIcon} />
            </View>
          </View>
        )}
      </View>
      <MessageReplies noBorder={noBorder} repliesCurveColor={repliesCurveColor} />
      <MessageFooter formattedDate={getDateText(formatDate)} isDeleted={!!isMessageTypeDeleted} />
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageContentPropsWithContext<StreamChatGenerics>,
  nextProps: MessageContentPropsWithContext<StreamChatGenerics>,
) => {
  const {
    goToMessage: prevGoToMessage,
    groupStyles: prevGroupStyles,
    hasReactions: prevHasReactions,
    isAttachmentEqual,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
    message: prevMessage,
    messageContentOrder: prevMessageContentOrder,
    onlyEmojis: prevOnlyEmojis,
    otherAttachments: prevOtherAttachments,
    t: prevT,
    tDateTimeParser: prevTDateTimeParser,
  } = prevProps;
  const {
    goToMessage: nextGoToMessage,
    groupStyles: nextGroupStyles,
    hasReactions: nextHasReactions,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
    message: nextMessage,
    messageContentOrder: nextMessageContentOrder,
    onlyEmojis: nextOnlyEmojis,
    otherAttachments: nextOtherAttachments,
    t: nextT,
    tDateTimeParser: nextTDateTimeParser,
  } = nextProps;

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  if (!hasReactionsEqual) return false;

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) return false;

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;
  if (goToMessageChangedAndMatters) return false;

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) return false;

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length === nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) return false;

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) return false;

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length &&
    prevGroupStyles?.[0] === nextGroupStyles?.[0];
  if (!groupStylesEqual) return false;

  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) return false;

  const isPrevQuotedMessageTypeDeleted = prevMessage.quoted_message?.type === 'deleted';
  const isNextQuotedMessageTypeDeleted = nextMessage.quoted_message?.type === 'deleted';

  const quotedMessageEqual =
    prevMessage.quoted_message?.id === nextMessage.quoted_message?.id &&
    isPrevQuotedMessageTypeDeleted === isNextQuotedMessageTypeDeleted;
  if (!quotedMessageEqual) return false;

  const prevMessageAttachments = prevMessage.attachments;
  const nextMessageAttachments = nextMessage.attachments;
  const attachmentsEqual =
    Array.isArray(prevMessageAttachments) &&
    Array.isArray(nextMessageAttachments) &&
    prevMessageAttachments.length === nextMessageAttachments.length &&
    prevMessageAttachments.every((attachment, index) => {
      const attachmentKeysEqual =
        attachment.type === 'image'
          ? attachment.image_url === nextMessageAttachments[index].image_url &&
            attachment.thumb_url === nextMessageAttachments[index].thumb_url
          : attachment.type === nextMessageAttachments[index].type;

      const customIsAttachmentEqual =
        isAttachmentEqual && isAttachmentEqual(attachment, nextMessageAttachments[index]);

      return attachmentKeysEqual && customIsAttachmentEqual;
    });
  if (!attachmentsEqual) return false;

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) && Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length === nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) => type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) return false;

  const messageContentOrderEqual =
    prevMessageContentOrder.length === nextMessageContentOrder.length &&
    prevMessageContentOrder.every(
      (messageContentType, index) => messageContentType === nextMessageContentOrder[index],
    );
  if (!messageContentOrderEqual) return false;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const tDateTimeParserEqual = prevTDateTimeParser === nextTDateTimeParser;
  if (!tDateTimeParserEqual) return false;

  return true;
};

const MemoizedMessageContent = React.memo(
  MessageContentWithContext,
  areEqual,
) as typeof MessageContentWithContext;

export type MessageContentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<MessageContentPropsWithContext<StreamChatGenerics>, 'setMessageContentWidth'>> &
  Pick<MessageContentPropsWithContext<StreamChatGenerics>, 'setMessageContentWidth'>;

/**
 * Child of MessageSimple that displays a message's content
 */
export const MessageContent = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageContentProps<StreamChatGenerics>,
) => {
  const {
    alignment,
    disabled,
    goToMessage,
    groupStyles,
    hasReactions,
    isMyMessage,
    lastGroupMessage,
    lastReceivedId,
    members,
    message,
    messageContentOrder,
    onLongPress,
    onlyEmojis,
    onPress,
    onPressIn,
    otherAttachments,
    preventPress,
    showMessageStatus,
    threadList,
  } = useMessageContext<StreamChatGenerics>();
  const {
    additionalTouchableProps,
    Attachment,
    FileAttachmentGroup,
    formatDate,
    Gallery,
    isAttachmentEqual,
    MessageDeleted,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageStatus,
    Reply,
  } = useMessagesContext<StreamChatGenerics>();
  const { t, tDateTimeParser } = useTranslationContext();

  return (
    <MemoizedMessageContent<StreamChatGenerics>
      {...{
        additionalTouchableProps,
        alignment,
        Attachment,
        disabled,
        FileAttachmentGroup,
        formatDate,
        Gallery,
        goToMessage,
        groupStyles,
        hasReactions,
        isAttachmentEqual,
        isMyMessage,
        lastGroupMessage,
        lastReceivedId,
        members,
        message,
        messageContentOrder,
        MessageDeleted,
        MessageFooter,
        MessageHeader,
        MessageReplies,
        MessageStatus,
        onLongPress,
        onlyEmojis,
        onPress,
        onPressIn,
        otherAttachments,
        preventPress,
        Reply,
        showMessageStatus,
        t,
        tDateTimeParser,
        threadList,
      }}
      {...props}
    />
  );
};

MessageContent.displayName = 'MessageContent{messageSimple{content}}';
