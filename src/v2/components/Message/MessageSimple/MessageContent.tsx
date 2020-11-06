import React from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

import { Error } from '../../../icons/Error';
import { Eye } from '../../../icons/Eye';

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
  leftAlignContent: {
    justifyContent: 'flex-start',
  },
  leftAlignItems: {
    alignItems: 'flex-start',
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
    | 'hasReactions'
    | 'lastGroupMessage'
    | 'message'
    | 'onLongPress'
    | 'showMessageStatus'
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
    | 'ReactionList'
    | 'reactionsEnabled'
    | 'repliesEnabled'
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
    hasReactions,
    lastGroupMessage,
    members,
    message,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageStatus,
    onLongPress,
    repliesEnabled,
    setMessageContentWidth,
    showMessageStatus,
    t,
    tDateTimeParser,
  } = props;

  const {
    theme: {
      messageSimple: {
        content: {
          container: { borderRadiusL, borderRadiusS, ...container },
          containerInner,
          deletedContainer,
          deletedMetaText,
          deletedText,
          errorContainer,
          errorIcon,
          errorIconContainer,
          eyeIcon,
          messageUser,
          metaContainer,
          metaText,
        },
        reactionList: { radius, reactionSize },
      },
    },
  } = useTheme();

  const getDateText = (formatter?: (date: TDateTimeParserInput) => string) => {
    if (!message.created_at) return '';

    if (formatter) {
      if (typeof message.created_at === 'string') {
        return formatter(message.created_at);
      } else {
        return formatter(message.created_at.asMutable());
      }
    }

    const parserOutput =
      typeof message.created_at === 'string'
        ? tDateTimeParser(message.created_at)
        : tDateTimeParser(message.created_at.asMutable());

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
          markdownStyles={deletedText}
          message={{ ...message, text: '_Message deleted_' }}
        />
        {MessageFooter ? (
          <MessageFooter testID='message-footer' />
        ) : (
          <View style={metaContainer} testID='message-status-time'>
            <Eye {...eyeIcon} />
            <Text
              style={[
                {
                  textAlign: alignment,
                },
                metaText,
                deletedMetaText,
              ]}
            >
              {t('Only visible to you')}
            </Text>
            <Text
              style={[
                {
                  textAlign: alignment,
                },
                metaText,
              ]}
            >
              {getDateText(formatDate)}
            </Text>
          </View>
        )}
      </View>
    );
  }

  const error = message.type === 'error' || message.status === 'failed';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onLongPress={onLongPress}
      {...additionalTouchableProps}
      /**
       * Border radii are useful for the case of error message types only.
       * Otherwise background is transparent, so border radius is not really visible.
       */
      style={[
        {
          borderTopLeftRadius: borderRadiusL,
          borderTopRightRadius: borderRadiusL,
        },
        ...(alignment === 'left'
          ? [
              styles.leftAlignContent,
              styles.leftAlignItems,
              {
                borderBottomLeftRadius: borderRadiusS,
                borderBottomRightRadius: borderRadiusL,
              },
            ]
          : [
              styles.rightAlignContent,
              styles.rightAlignItems,
              {
                borderBottomLeftRadius: borderRadiusL,
                borderBottomRightRadius: borderRadiusS,
              },
            ]),
        hasReactions ? { paddingTop: reactionSize / 2 + radius } : {},
        error ? errorContainer : {},
        container,
      ]}
    >
      {MessageHeader && <MessageHeader testID='message-header' />}
      <View onLayout={onLayout}>
        <View
          style={[
            alignment === 'left'
              ? styles.leftAlignItems
              : styles.rightAlignItems,
            containerInner,
          ]}
          testID='message-content-wrapper'
        >
          {Array.isArray(message.attachments) &&
            message.attachments.map((attachment, index) => {
              // We handle files separately
              if (
                attachment.type === 'file' ||
                (attachment.type === 'image' &&
                  !attachment.title_link &&
                  !attachment.og_scrape_url)
              ) {
                return null;
              }

              return (
                <Attachment
                  attachment={attachment}
                  key={`${message.id}-${index}`}
                />
              );
            })}
          <FileAttachmentGroup messageId={message.id} />
          <Gallery />
          <MessageTextContainer<At, Ch, Co, Ev, Me, Re, Us> />
        </View>
        {error && (
          <View style={StyleSheet.absoluteFill}>
            <View style={errorIconContainer}>
              <Error {...errorIcon} />
            </View>
          </View>
        )}
      </View>
      {repliesEnabled && <MessageReplies />}
      {MessageFooter && <MessageFooter testID='message-footer' />}
      {!MessageFooter && lastGroupMessage && (
        <View style={metaContainer} testID='message-status-time'>
          {Object.keys(members).length > 2 &&
          alignment === 'left' &&
          message.user?.name ? (
            <Text style={messageUser}>{message.user.name}</Text>
          ) : null}
          {showMessageStatus && <MessageStatus />}
          <Text style={[{ textAlign: alignment }, metaText]}>
            {getDateText(formatDate)}
          </Text>
        </View>
      )}
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
    hasReactions: prevHasReactions,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
    message: prevMessage,
  } = prevProps;
  const {
    hasReactions: nextHasReactions,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
    message: nextMessage,
  } = nextProps;

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  const membersEqual =
    Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  const messageEqual =
    Array.isArray(prevMessage.attachments) &&
    Array.isArray(nextMessage.attachments) &&
    prevMessage.attachments.length === nextMessage.attachments.length &&
    prevMessage.deleted_at === nextMessage.deleted_at &&
    prevMessage.type === nextMessage.type &&
    prevMessage.status === nextMessage.status &&
    prevMessage.updated_at === nextMessage.update_at;

  return (
    hasReactionsEqual && lastGroupMessageEqual && membersEqual && messageEqual
  );
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
  const {
    additionalTouchableProps: propAdditionalTouchableProps,
    alignment: propAlignment,
    Attachment: PropAttachment,
    disabled: propDisabled,
    FileAttachmentGroup: PropFileAttachmentGroup,
    formatDate: propFormatDate,
    Gallery: PropGallery,
    hasReactions: propHasReactions,
    lastGroupMessage: propLastGroupMessage,
    members: propMembers,
    message: propMessage,
    MessageFooter: PropMessageFooter,
    MessageHeader: PropMessageHeader,
    MessageReplies: PropMessageReplies,
    MessageStatus: PropMessageStatus,
    onLongPress: propOnLongPress,
    ReactionList: PropReactionList,
    reactionsEnabled: propReactionsEnabled,
    repliesEnabled: propRepliesEnabled,
    setMessageContentWidth,
    showMessageStatus: propShowMessageStatus,
    t: propT,
    tDateTimeParser: propTDateTimeParser,
  } = props;

  const {
    disabled: contextDisabled,
    members: contextMembers,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    alignment: contextAlignment,
    hasReactions: contextHasReactions,
    lastGroupMessage: contextLastGroupMessage,
    message: contextMessage,
    onLongPress: contextOnLongPress,
    showMessageStatus: contextShowMessageStatus,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTouchableProps: contextAdditionalTouchableProps,
    Attachment: ContextAttachment,
    FileAttachmentGroup: ContextFileAttachmentGroup,
    formatDate: contextFormatDate,
    Gallery: ContextGallery,
    MessageFooter: ContextMessageFooter,
    MessageHeader: ContextMessageHeader,
    MessageReplies: ContextMessageReplies,
    MessageStatus: ContextMessageStatus,
    ReactionList: ContextReactionList,
    reactionsEnabled: contextReactionsEnabled,
    repliesEnabled: contextRepliesEnabled,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    t: contextT,
    tDateTimeParser: contextTDateTimeParser,
  } = useTranslationContext();

  const additionalTouchableProps =
    propAdditionalTouchableProps || contextAdditionalTouchableProps;
  const alignment = propAlignment || contextAlignment;
  const Attachment = PropAttachment || ContextAttachment;
  const disabled = propDisabled || contextDisabled;
  const FileAttachmentGroup =
    PropFileAttachmentGroup || ContextFileAttachmentGroup;
  const formatDate = propFormatDate || contextFormatDate;
  const Gallery = PropGallery || ContextGallery;
  const hasReactions = propHasReactions || contextHasReactions;
  const lastGroupMessage = propLastGroupMessage || contextLastGroupMessage;
  const members = propMembers || contextMembers;
  const message = propMessage || contextMessage;
  const MessageFooter = PropMessageFooter || ContextMessageFooter;
  const MessageHeader = PropMessageHeader || ContextMessageHeader;
  const MessageReplies = PropMessageReplies || ContextMessageReplies;
  const MessageStatus = PropMessageStatus || ContextMessageStatus;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const ReactionList = PropReactionList || ContextReactionList;
  const reactionsEnabled = propReactionsEnabled || contextReactionsEnabled;
  const repliesEnabled = propRepliesEnabled || contextRepliesEnabled;
  const showMessageStatus = propShowMessageStatus || contextShowMessageStatus;
  const t = propT || contextT;
  const tDateTimeParser = propTDateTimeParser || contextTDateTimeParser;

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
        hasReactions,
        lastGroupMessage,
        members,
        message,
        MessageFooter,
        MessageHeader,
        MessageReplies,
        MessageStatus,
        onLongPress,
        ReactionList,
        reactionsEnabled,
        repliesEnabled,
        setMessageContentWidth,
        showMessageStatus,
        t,
        tDateTimeParser,
      }}
    />
  );
};

MessageContent.displayName = 'MessageContent{messageSimple{content}}';
