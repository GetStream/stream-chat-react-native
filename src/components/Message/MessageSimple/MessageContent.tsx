import React from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import merge from 'lodash/merge';

import { MessageTextContainer } from './MessageTextContainer';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../contexts/channelContext/ChannelContext';
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
import { vw } from '../../../utils/utils';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'disabled' | 'members'
> &
  Pick<
    MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'alignment'
    | 'groupStyles'
    | 'hasReactions'
    | 'lastGroupMessage'
    | 'message'
    | 'messageContentOrder'
    | 'onLongPress'
    | 'onlyEmojis'
    | 'onPress'
    | 'otherAttachments'
    | 'preventPress'
    | 'showMessageStatus'
    | 'threadList'
  > &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'additionalTouchableProps'
    | 'Attachment'
    | 'FileAttachmentGroup'
    | 'formatDate'
    | 'Gallery'
    | 'MessageFooter'
    | 'MessageHeader'
    | 'MessageReplies'
    | 'MessageStatus'
    | 'onPressInMessage'
    | 'repliesEnabled'
    | 'Reply'
  > &
  Pick<TranslationContextValue, 't' | 'tDateTimeParser'> & {
    setMessageContentWidth: React.Dispatch<React.SetStateAction<number>>;
  };

/**
 * Child of MessageSimple that displays a message's content
 */
export const MessageContentWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageContentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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
    lastGroupMessage,
    members,
    message,
    messageContentOrder,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageStatus,
    onLongPress,
    onlyEmojis,
    onPress,
    onPressInMessage,
    otherAttachments,
    preventPress,
    repliesEnabled,
    Reply,
    setMessageContentWidth,
    showMessageStatus,
    tDateTimeParser,
    threadList,
  } = props;

  const {
    theme: {
      colors: {
        accent_red,
        blue_alice,
        grey,
        grey_gainsboro,
        grey_whisper,
        transparent,
      },
      messageSimple: {
        content: {
          container: { borderRadiusL, borderRadiusS, ...container },
          containerInner,
          deletedContainer,
          deletedText,
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

  if (message.deleted_at) {
    return (
      <View
        onLayout={onLayout}
        style={[
          alignment === 'left' ? styles.leftAlignItems : styles.rightAlignItems,
          deletedContainer,
        ]}
      >
        <MessageTextContainer<At, Ch, Co, Ev, Me, Re, Us>
          markdownStyles={merge({ em: { color: grey } }, deletedText)}
          message={{ ...message, text: '_Message deleted_' }}
        />
        <MessageFooter
          alignment={alignment}
          formattedDate={getDateText(formatDate)}
          isDeleted
          members={members}
          message={message}
          MessageStatus={MessageStatus}
          otherAttachments={otherAttachments}
          showMessageStatus={showMessageStatus}
          testID='message-footer'
        />
      </View>
    );
  }

  const error = message.type === 'error' || message.status === 'failed';

  const groupStyle = `${alignment}_${groupStyles[0].toLowerCase()}`;

  const hasThreadReplies = !!message?.reply_count;

  const noBorder =
    (onlyEmojis && !message.quoted_message) || !!otherAttachments.length;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
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
          isDeleted={!!message.deleted_at}
          lastGroupMessage={lastGroupMessage}
          members={members}
          message={message}
          MessageStatus={MessageStatus}
          otherAttachments={otherAttachments}
          showMessageStatus={showMessageStatus}
          testID='message-header'
        />
      )}
      <View onLayout={onLayout} style={wrapper}>
        {hasThreadReplies && !threadList && repliesEnabled && !noBorder && (
          <View
            style={[
              styles.replyBorder,
              {
                borderColor: grey_whisper,
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
              backgroundColor:
                onlyEmojis && !message.quoted_message
                  ? transparent
                  : otherAttachments.length
                  ? otherAttachments[0].type === 'giphy'
                    ? transparent
                    : blue_alice
                  : alignment === 'left' || error
                  ? transparent
                  : grey_gainsboro,
              borderBottomLeftRadius:
                (groupStyle === 'left_bottom' ||
                  groupStyle === 'left_single') &&
                (!hasThreadReplies || threadList)
                  ? borderRadiusS
                  : borderRadiusL,
              borderBottomRightRadius:
                (groupStyle === 'right_bottom' ||
                  groupStyle === 'right_single') &&
                (!hasThreadReplies || threadList)
                  ? borderRadiusS
                  : borderRadiusL,
              borderColor: grey_whisper,
            },
            noBorder ? { borderWidth: 0 } : {},
            containerInner,
          ]}
          testID='message-content-wrapper'
        >
          {message.quoted_message && (
            <View style={[styles.replyContainer, replyContainer]}>
              <Reply styles={{ messageContainer: { maxWidth: vw(60) } }} />
            </View>
          )}
          {messageContentOrder.map(
            (messageContentType, messageContentOrderIndex) => {
              switch (messageContentType) {
                case 'attachments':
                  return otherAttachments.map((attachment, attachmentIndex) => (
                    <Attachment
                      attachment={attachment}
                      key={`${message.id}-${attachmentIndex}`}
                      onPressIn={onPressInMessage}
                    />
                  ));
                case 'files':
                  return (
                    <FileAttachmentGroup
                      key={`file_attachment_group_${messageContentOrderIndex}`}
                      messageId={message.id}
                      onPressIn={onPressInMessage}
                    />
                  );
                case 'gallery':
                  return (
                    <Gallery
                      key={`gallery_${messageContentOrderIndex}`}
                      onPressIn={onPressInMessage}
                      preventPress={preventPress}
                    />
                  );
                case 'text':
                default:
                  return otherAttachments.length &&
                    otherAttachments[0].actions ? null : (
                    <MessageTextContainer<At, Ch, Co, Ev, Me, Re, Us>
                      key={`message_text_container_${messageContentOrderIndex}`}
                    />
                  );
              }
            },
          )}
        </View>
        {error && (
          <View style={StyleSheet.absoluteFill}>
            <View style={errorIconContainer}>
              <Error pathFill={accent_red} {...errorIcon} />
            </View>
          </View>
        )}
      </View>
      {repliesEnabled && <MessageReplies noBorder={noBorder} />}
      <MessageFooter
        alignment={alignment}
        formattedDate={getDateText(formatDate)}
        lastGroupMessage={lastGroupMessage}
        members={members}
        message={message}
        MessageStatus={MessageStatus}
        otherAttachments={otherAttachments}
        showMessageStatus={showMessageStatus}
        testID='message-footer'
      />
    </TouchableOpacity>
  );
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
  prevProps: MessageContentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageContentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    groupStyles: prevGroupStyles,
    hasReactions: prevHasReactions,
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

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) return false;

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length ===
      nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) return false;

  const membersEqual =
    Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) return false;

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length &&
    prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) return false;

  const messageEqual =
    prevMessage.deleted_at === nextMessage.deleted_at &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text;
  if (!messageEqual) return false;

  const prevAttachments = prevMessage.attachments;
  const nextAttachments = nextMessage.attachments;
  const attachmentsEqual =
    Array.isArray(prevAttachments) && Array.isArray(nextAttachments)
      ? prevAttachments.length === nextAttachments.length &&
        prevAttachments.every(
          (attachment, index) =>
            attachment.image_url === nextAttachments[index].image_url &&
            attachment.og_scrape_url === nextAttachments[index].og_scrape_url &&
            attachment.thumb_url === nextAttachments[index].thumb_url,
        )
      : prevAttachments === nextAttachments;
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

  const messageContentOrderEqual =
    prevMessageContentOrder.length === nextMessageContentOrder.length &&
    prevMessageContentOrder.every(
      (messageContentType, index) =>
        messageContentType === nextMessageContentOrder[index],
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<
    MessageContentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'setMessageContentWidth'
  >
> &
  Pick<
    MessageContentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'setMessageContentWidth'
  >;

/**
 * Child of MessageSimple that displays a message's content
 */
export const MessageContent = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageContentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled, members } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    alignment,
    groupStyles,
    hasReactions,
    lastGroupMessage,
    message,
    messageContentOrder,
    onLongPress,
    onlyEmojis,
    onPress,
    otherAttachments,
    preventPress,
    showMessageStatus,
    threadList,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTouchableProps,
    Attachment,
    FileAttachmentGroup,
    formatDate,
    Gallery,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageStatus,
    onPressInMessage,
    repliesEnabled,
    Reply,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t, tDateTimeParser } = useTranslationContext();

  return (
    <MemoizedMessageContent<At, Ch, Co, Ev, Me, Re, Us>
      {...{
        additionalTouchableProps,
        alignment,
        Attachment,
        disabled,
        FileAttachmentGroup,
        formatDate,
        Gallery,
        groupStyles,
        hasReactions,
        lastGroupMessage,
        members,
        message,
        messageContentOrder,
        MessageFooter,
        MessageHeader,
        MessageReplies,
        MessageStatus,
        onLongPress,
        onlyEmojis,
        onPress,
        onPressInMessage,
        otherAttachments,
        preventPress,
        repliesEnabled,
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
