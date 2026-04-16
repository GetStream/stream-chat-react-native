import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';

import { SwipableMessageWrapper } from './MessageBubble';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import {
  Alignment,
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { useStableCallback } from '../../../hooks/useStableCallback';

import { primitives } from '../../../theme';
import { FileTypes } from '../../../types/types';
import { checkMessageEquality, checkQuotedMessageEquality } from '../../../utils/utils';
import { useMessageData } from '../hooks/useMessageData';

type GroupType = 'single' | 'top' | 'middle' | 'bottom' | undefined;

const useStyles = ({
  alignment,
  isVeryLastMessage,
  messageGroupedSingle,
  messageGroupedBottom,
  messageGroupedTop,
  messageGroupedMiddle,
  enableMessageGroupingByUser,
}: {
  alignment: Alignment;
  isVeryLastMessage: boolean;
  messageGroupedSingle: boolean;
  messageGroupedBottom: boolean;
  messageGroupedTop: boolean;
  messageGroupedMiddle: boolean;
  enableMessageGroupingByUser: boolean;
}) => {
  const {
    theme: {
      messageItemView: {
        container,
        bubbleContentContainer,
        bubbleErrorContainer,
        bubbleReactionListTopContainer,
        bubbleWrapper,
        contentContainer,
        repliesContainer,
        leftAlignItems,
        rightAlignItems,
        messageGroupedSingleStyles,
        messageGroupedBottomStyles,
        messageGroupedTopStyles,
        messageGroupedMiddleStyles,
        lastMessageContainer,
      },
    },
  } = useTheme();

  const groupType: GroupType = useMemo(() => {
    if (messageGroupedSingle) return 'single';
    if (messageGroupedTop) return 'top';
    if (messageGroupedMiddle) return 'middle';
    if (messageGroupedBottom) return 'bottom';
    return undefined;
  }, [messageGroupedSingle, messageGroupedTop, messageGroupedMiddle, messageGroupedBottom]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        baseContainer: {
          alignItems: 'flex-end',
          gap: primitives.spacingXs,
          flexDirection: alignment === 'left' ? 'row' : 'row-reverse',
          width: '100%',
          ...container,
        },
        contentContainer: {
          gap: primitives.spacingXxs,
          ...contentContainer,
        },
        bubbleContentContainer: {
          alignSelf: alignment === 'left' ? 'flex-start' : 'flex-end',
          ...bubbleContentContainer,
        },
        bubbleErrorContainer: {
          position: 'absolute',
          top: 8,
          right: -12,
          ...bubbleErrorContainer,
        },
        bubbleReactionListTopContainer: {
          alignSelf: alignment === 'left' ? 'flex-end' : 'flex-start',
          ...bubbleReactionListTopContainer,
        },
        bubbleWrapper: {
          zIndex: 1,
          ...bubbleWrapper,
        },
        repliesContainer: {
          marginTop: -primitives.spacingXxs, // Reducing the margin to account the gap added in the content container
          zIndex: 0,
          ...repliesContainer,
        },
        leftAlignItems: {
          alignItems: 'flex-start',
          ...leftAlignItems,
        },
        rightAlignItems: {
          alignItems: 'flex-end',
          ...rightAlignItems,
        },
      }),
    [
      alignment,
      bubbleContentContainer,
      bubbleErrorContainer,
      bubbleReactionListTopContainer,
      bubbleWrapper,
      container,
      contentContainer,
      leftAlignItems,
      repliesContainer,
      rightAlignItems,
    ],
  );

  const groupStylesMap = useMemo(() => {
    return {
      single: {
        paddingVertical: primitives.spacingXs,
        ...messageGroupedSingleStyles,
      },
      top: {
        paddingTop: primitives.spacingXs,
        paddingBottom: primitives.spacingXxs,
        ...messageGroupedTopStyles,
      },
      middle: {
        paddingBottom: primitives.spacingXxs,
        ...messageGroupedMiddleStyles,
      },
      bottom: {
        paddingBottom: primitives.spacingXs,
        ...messageGroupedBottomStyles,
      },
    };
  }, [
    messageGroupedBottomStyles,
    messageGroupedMiddleStyles,
    messageGroupedSingleStyles,
    messageGroupedTopStyles,
  ]);

  const containerStyle = useMemo(() => {
    let results: ViewStyle = styles.baseContainer;

    if (groupType) {
      results = {
        ...results,
        ...groupStylesMap[groupType],
      };
    }

    if (isVeryLastMessage && enableMessageGroupingByUser) {
      results = {
        ...results,
        marginBottom: primitives.spacingSm,
        ...lastMessageContainer,
      };
    }

    return results;
  }, [
    styles.baseContainer,
    groupStylesMap,
    groupType,
    isVeryLastMessage,
    enableMessageGroupingByUser,
    lastMessageContainer,
  ]);

  return {
    container: containerStyle,
    bubbleContentContainer: styles.bubbleContentContainer,
    bubbleErrorContainer: styles.bubbleErrorContainer,
    bubbleReactionListTopContainer: styles.bubbleReactionListTopContainer,
    bubbleWrapper: styles.bubbleWrapper,
    contentContainer: styles.contentContainer,
    repliesContainer: styles.repliesContainer,
    leftAlignItems: styles.leftAlignItems,
    rightAlignItems: styles.rightAlignItems,
  };
};

export type MessageItemViewPropsWithContext = Pick<
  MessageContextValue,
  | 'alignment'
  | 'channel'
  | 'groupStyles'
  | 'hasAttachmentActions'
  | 'isMyMessage'
  | 'message'
  | 'onlyEmojis'
  | 'otherAttachments'
  | 'setQuotedMessage'
  | 'lastGroupMessage'
  | 'contextMenuAnchorRef'
  | 'members'
> &
  Pick<
    MessagesContextValue,
    | 'customMessageSwipeAction'
    | 'enableMessageGroupingByUser'
    | 'enableSwipeToReply'
    | 'myMessageTheme'
    | 'messageSwipeToReplyHitSlop'
    | 'reactionListPosition'
    | 'reactionListType'
  >;

const MessageItemViewWithContext = (props: MessageItemViewPropsWithContext) => {
  const { width } = Dimensions.get('screen');
  const {
    alignment,
    channel,
    contextMenuAnchorRef,
    customMessageSwipeAction,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    groupStyles,
    hasAttachmentActions,
    isMyMessage,
    message,
    messageSwipeToReplyHitSlop = { left: width, right: width },
    onlyEmojis,
    otherAttachments,
    reactionListPosition,
    reactionListType,
    setQuotedMessage,
  } = props;
  const {
    MessageAuthor,
    MessageContent,
    MessageDeleted,
    MessageError,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageSpacer,
    ReactionListBottom,
    ReactionListTop,
  } = useComponentsContext();

  const {
    theme: {
      semantics,
      messageItemView: {
        content: { errorContainer },
      },
    },
  } = useTheme();

  const {
    isMessageErrorType,
    isMessageReceivedOrErrorType,
    isMessageTypeDeleted,
    isVeryLastMessage,
    messageGroupedSingle,
    messageGroupedBottom,
    messageGroupedTop,
    messageGroupedSingleOrBottom,
    messageGroupedMiddle,
  } = useMessageData({});

  const styles = useStyles({
    alignment,
    isVeryLastMessage,
    messageGroupedSingle,
    messageGroupedBottom,
    messageGroupedTop,
    messageGroupedMiddle,
    enableMessageGroupingByUser,
  });

  const groupStyle = `${alignment}_${groupStyles?.[0]?.toLowerCase?.()}`;
  const hasVisibleQuotedReply = !!message.quoted_message && !hasAttachmentActions;
  const hasStandaloneGiphyOrImgur =
    !hasVisibleQuotedReply &&
    otherAttachments.length > 0 &&
    (otherAttachments[0].type === FileTypes.Giphy || otherAttachments[0].type === FileTypes.Imgur);

  let noBorder = onlyEmojis && !hasVisibleQuotedReply;
  if (otherAttachments.length) {
    if (hasStandaloneGiphyOrImgur && !isMyMessage) {
      noBorder = false;
    } else {
      noBorder = true;
    }
  }

  let backgroundColor = semantics.chatBgOutgoing;
  if (onlyEmojis && !hasVisibleQuotedReply) {
    backgroundColor = 'transparent';
  } else if (hasStandaloneGiphyOrImgur) {
    backgroundColor = 'transparent';
  } else if (isMessageReceivedOrErrorType) {
    backgroundColor = semantics.chatBgIncoming;
  }

  const onSwipeActionHandler = useStableCallback(() => {
    if (customMessageSwipeAction) {
      customMessageSwipeAction({ channel, message });
      return;
    }
    setQuotedMessage(message);
  });

  const itemViewContent = (
    <View pointerEvents='box-none' style={styles.container} testID='message-item-view-wrapper'>
      {alignment === 'left' ? <MessageAuthor /> : null}
      {isMessageTypeDeleted ? (
        <MessageDeleted date={message.created_at} groupStyle={groupStyle} />
      ) : (
        <View
          style={[
            styles.contentContainer,
            isMyMessage ? styles.rightAlignItems : styles.leftAlignItems,
            isMessageErrorType ? errorContainer : {},
          ]}
          testID='message-components'
        >
          <MessageHeader />
          <View style={styles.bubbleWrapper}>
            {reactionListPosition === 'top' && ReactionListTop ? (
              <View style={styles.bubbleReactionListTopContainer}>
                <ReactionListTop type={reactionListType} />
              </View>
            ) : null}
            <View ref={contextMenuAnchorRef} style={styles.bubbleContentContainer}>
              <MessageContent
                backgroundColor={backgroundColor}
                isVeryLastMessage={isVeryLastMessage}
                messageGroupedSingleOrBottom={messageGroupedSingleOrBottom}
                noBorder={noBorder}
              />
              {isMessageErrorType ? (
                <View style={styles.bubbleErrorContainer}>
                  <MessageError />
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.repliesContainer}>
            <MessageReplies />
          </View>

          {reactionListPosition === 'bottom' && ReactionListBottom ? (
            <ReactionListBottom type={reactionListType} />
          ) : null}
          <MessageFooter date={message.created_at} />
        </View>
      )}
      {MessageSpacer ? <MessageSpacer /> : null}
    </View>
  );

  return enableSwipeToReply && !isMessageTypeDeleted ? (
    <SwipableMessageWrapper
      messageSwipeToReplyHitSlop={messageSwipeToReplyHitSlop}
      onSwipe={onSwipeActionHandler}
    >
      {itemViewContent}
    </SwipableMessageWrapper>
  ) : (
    itemViewContent
  );
};

const areEqual = (
  prevProps: MessageItemViewPropsWithContext,
  nextProps: MessageItemViewPropsWithContext,
) => {
  const {
    channel: prevChannel,
    groupStyles: prevGroupStyles,
    message: prevMessage,
    myMessageTheme: prevMyMessageTheme,
    onlyEmojis: prevOnlyEmojis,
    otherAttachments: prevOtherAttachments,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
  } = prevProps;
  const {
    channel: nextChannel,
    groupStyles: nextGroupStyles,
    message: nextMessage,
    myMessageTheme: nextMyMessageTheme,
    onlyEmojis: nextOnlyEmojis,
    otherAttachments: nextOtherAttachments,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
  } = nextProps;

  const groupStylesEqual = prevGroupStyles === nextGroupStyles;
  if (!groupStylesEqual) {
    return false;
  }

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) {
    return false;
  }

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) {
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

  const channelEqual = prevChannel?.state.messages.length === nextChannel?.state.messages.length;
  if (!channelEqual) {
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

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) {
    return false;
  }

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) {
    return false;
  }

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length === nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageItemView = React.memo(
  MessageItemViewWithContext,
  areEqual,
) as typeof MessageItemViewWithContext;

export type MessageItemViewProps = Partial<MessageItemViewPropsWithContext>;

/**
 *
 * Message UI component
 */
export const MessageItemView = (props: MessageItemViewProps) => {
  const {
    alignment,
    channel,
    groupStyles,
    hasAttachmentActions,
    isMyMessage,
    message,
    contextMenuAnchorRef,
    onlyEmojis,
    otherAttachments,
    setQuotedMessage,
    lastGroupMessage,
    members,
  } = useMessageContext();

  const {
    customMessageSwipeAction,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    messageSwipeToReplyHitSlop,
    myMessageTheme,
    reactionListPosition,
    reactionListType,
  } = useMessagesContext();

  return (
    <MemoizedMessageItemView
      {...{
        alignment,
        channel,
        contextMenuAnchorRef,
        customMessageSwipeAction,
        enableMessageGroupingByUser,
        enableSwipeToReply,
        groupStyles,
        hasAttachmentActions,
        isMyMessage,
        message,
        messageSwipeToReplyHitSlop,
        myMessageTheme,
        onlyEmojis,
        otherAttachments,
        reactionListPosition,
        reactionListType,
        setQuotedMessage,
        lastGroupMessage,
        members,
      }}
      {...props}
    />
  );
};

MessageItemView.displayName = 'MessageItemView{messageItemView{container}}';
