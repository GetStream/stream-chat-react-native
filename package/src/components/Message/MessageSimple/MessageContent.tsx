import React from 'react';
import {
  AnimatableNumericValue,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

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
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import { useViewport } from '../../../hooks/useViewport';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageStatusTypes } from '../../../utils/utils';

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
  | 'isEditedMessageOpen'
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
    | 'Gallery'
    | 'isAttachmentEqual'
    | 'MessageFooter'
    | 'MessageHeader'
    | 'MessageDeleted'
    | 'MessageError'
    | 'MessagePinnedHeader'
    | 'MessageReplies'
    | 'MessageStatus'
    | 'myMessageTheme'
    | 'onPressInMessage'
    | 'Reply'
  > &
  Pick<TranslationContextValue, 't'> & {
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
    FileAttachmentGroup,
    Gallery,
    groupStyles,
    hasReactions,
    isMyMessage,
    lastGroupMessage,
    members,
    message,
    messageContentOrder,
    MessageDeleted,
    MessageError,
    MessageFooter,
    MessageHeader,
    MessagePinnedHeader,
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
    threadList,
  } = props;

  const {
    theme: {
      colors: { blue_alice, grey_gainsboro, grey_whisper, transparent, white },
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
          errorContainer,
          receiverMessageBackgroundColor,
          replyBorder,
          replyContainer,
          senderMessageBackgroundColor,
          wrapper,
        },
        reactionList: { radius, reactionSize },
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
        date={message.created_at}
        groupStyle={groupStyle}
        noBorder={noBorder}
        onLayout={onLayout}
      />
    );
  }

  const isMessageReceivedOrErrorType = !isMyMessage || error;

  let backgroundColor = senderMessageBackgroundColor || grey_gainsboro;
  if (onlyEmojis && !message.quoted_message) {
    backgroundColor = transparent;
  } else if (otherAttachments.length) {
    if (otherAttachments[0].type === 'giphy') {
      backgroundColor = message.quoted_message ? grey_gainsboro : transparent;
    } else {
      backgroundColor = blue_alice;
    }
  } else if (isMessageReceivedOrErrorType) {
    backgroundColor = receiverMessageBackgroundColor || white;
  }

  const repliesCurveColor = !isMessageReceivedOrErrorType ? backgroundColor : grey_gainsboro;

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
    const bordersFromTheme: Record<string, AnimatableNumericValue | undefined> = {
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
    <TouchableOpacity
      activeOpacity={0.7}
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
      testID='message-content'
      {...additionalTouchableProps}
      /**
       * Border radii are useful for the case of error message types only.
       * Otherwise background is transparent, so border radius is not really visible.
       */
      style={[
        isMyMessage ? styles.rightAlignItems : styles.leftAlignItems,
        { paddingTop: hasReactions ? reactionSize / 2 + radius : 2 },
        error ? errorContainer : {},
        container,
      ]}
    >
      {MessageHeader && (
        <MessageHeader
          alignment={alignment}
          date={message.created_at}
          isDeleted={isMessageTypeDeleted}
          lastGroupMessage={lastGroupMessage}
          members={members}
          message={message}
          MessageStatus={MessageStatus}
          otherAttachments={otherAttachments}
          showMessageStatus={showMessageStatus}
        />
      )}
      {message.pinned && <MessagePinnedHeader />}
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
              borderColor: isMessageReceivedOrErrorType ? grey_whisper : backgroundColor,
              ...getBorderRadius(),
              ...getBorderRadiusFromTheme(),
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
        {error && <MessageError />}
      </View>
      <MessageReplies noBorder={noBorder} repliesCurveColor={repliesCurveColor} />
      <MessageFooter date={message.created_at} isDeleted={!!isMessageTypeDeleted} />
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
    isEditedMessageOpen: prevIsEditedMessageOpen,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
    message: prevMessage,
    messageContentOrder: prevMessageContentOrder,
    myMessageTheme: prevMyMessageTheme,
    onlyEmojis: prevOnlyEmojis,
    otherAttachments: prevOtherAttachments,
    t: prevT,
  } = prevProps;
  const {
    goToMessage: nextGoToMessage,
    groupStyles: nextGroupStyles,
    hasReactions: nextHasReactions,
    isEditedMessageOpen: nextIsEditedMessageOpen,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
    message: nextMessage,
    messageContentOrder: nextMessageContentOrder,
    myMessageTheme: nextMyMessageTheme,
    onlyEmojis: nextOnlyEmojis,
    otherAttachments: nextOtherAttachments,
    t: nextT,
  } = nextProps;

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  if (!hasReactionsEqual) return false;

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) return false;

  const goToMessageChangedAndMatters =
    nextMessage.quoted_message_id && prevGoToMessage !== nextGoToMessage;
  if (goToMessageChangedAndMatters) return false;

  const isEditedMessageOpenEqual = prevIsEditedMessageOpen === nextIsEditedMessageOpen;
  if (!isEditedMessageOpenEqual) return false;

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
    prevMessage.pinned === nextMessage.pinned &&
    prevMessage.i18n === nextMessage.i18n;
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
    Array.isArray(prevMessageAttachments) && Array.isArray(nextMessageAttachments)
      ? prevMessageAttachments.length === nextMessageAttachments.length &&
        prevMessageAttachments.every((attachment, index) => {
          const attachmentKeysEqual =
            attachment.image_url === nextMessageAttachments[index].image_url &&
            attachment.og_scrape_url === nextMessageAttachments[index].og_scrape_url &&
            attachment.thumb_url === nextMessageAttachments[index].thumb_url &&
            attachment.type === nextMessageAttachments[index].type;

          if (isAttachmentEqual)
            return (
              attachmentKeysEqual && !!isAttachmentEqual(attachment, nextMessageAttachments[index])
            );

          return attachmentKeysEqual;
        })
      : prevMessageAttachments === nextMessageAttachments;
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

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) return false;

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
    goToMessage,
    groupStyles,
    hasReactions,
    isEditedMessageOpen,
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
    Gallery,
    isAttachmentEqual,
    MessageDeleted,
    MessageError,
    MessageFooter,
    MessageHeader,
    MessagePinnedHeader,
    MessageReplies,
    MessageStatus,
    myMessageTheme,
    Reply,
  } = useMessagesContext<StreamChatGenerics>();
  const { t } = useTranslationContext();

  return (
    <MemoizedMessageContent<StreamChatGenerics>
      {...{
        additionalTouchableProps,
        alignment,
        Attachment,
        FileAttachmentGroup,
        Gallery,
        goToMessage,
        groupStyles,
        hasReactions,
        isAttachmentEqual,
        isEditedMessageOpen,
        isMyMessage,
        lastGroupMessage,
        lastReceivedId,
        members,
        message,
        messageContentOrder,
        MessageDeleted,
        MessageError,
        MessageFooter,
        MessageHeader,
        MessagePinnedHeader,
        MessageReplies,
        MessageStatus,
        myMessageTheme,
        onLongPress,
        onlyEmojis,
        onPress,
        onPressIn,
        otherAttachments,
        preventPress,
        Reply,
        showMessageStatus,
        t,
        threadList,
      }}
      {...props}
    />
  );
};

MessageContent.displayName = 'MessageContent{messageSimple{content}}';
