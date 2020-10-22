import React, { useEffect, useRef } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MessageActionSheet as DefaultActionSheet } from './MessageActionSheet';
import {
  MessageReplies as DefaultMessageReplies,
  MessageRepliesProps,
} from './MessageReplies';
import { MessageTextContainer } from './MessageTextContainer';

import { Attachment as DefaultAttachment } from '../../Attachment/Attachment';
import { FileAttachment as DefaultFileAttachment } from '../../Attachment/FileAttachment';
import { FileAttachmentGroup as DefaultFileAttachmentGroup } from '../../Attachment/FileAttachmentGroup';
import { Gallery as DefaultGallery } from '../../Attachment/Gallery';
import {
  ReactionList as DefaultReactionList,
  LatestReactions,
} from '../../Reaction/ReactionList';
import { ReactionPickerWrapper } from '../../Reaction/ReactionPickerWrapper';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { MessageContentProvider } from '../../../contexts/messageContentContext/MessageContentContext';
import {
  Alignment,
  GroupType,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import {
  isDayOrMoment,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';
import { emojiData } from '../../../utils/utils';

import type { ActionSheetCustom } from 'react-native-actionsheet';
import type { MessageResponse } from 'stream-chat';

import type { MessageSimpleProps } from './MessageSimple';
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
  container: {
    maxWidth: 250,
  },
  deletedContainer: {
    maxWidth: 250,
    padding: 5,
  },
  deletedText: {
    color: '#A4A4A4',
    fontSize: 15,
    lineHeight: 20,
  },
  failedText: {
    color: '#A4A4A4',
    marginRight: 5,
  },
  leftAlignContent: {
    justifyContent: 'flex-start',
  },
  leftAlignItems: {
    alignItems: 'flex-start',
  },
  metaContainer: {
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
  },
  rightAlignContent: {
    justifyContent: 'flex-end',
  },
  rightAlignItems: {
    alignItems: 'flex-end',
  },
});

export type ForwardedMessageProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: Alignment;
  /**
   * Whether or not the app is using a custom MessageContent component
   */
  customMessageContent: boolean;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: GroupType[];
  /**
   * Custom message footer component
   */
  MessageFooter?: React.ComponentType<UnknownType & { testID: string }>;
  /**
   * Custom message header component
   */
  MessageHeader?: React.ComponentType<UnknownType & { testID: string }>;
  /**
   * Custom message replies component
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageReplies.tsx
   */
  MessageReplies?: React.ComponentType<
    MessageRepliesProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
};

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
  props: ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    ActionSheet = DefaultActionSheet,
    Attachment: PropsAttachment,
    AttachmentActions,
    AttachmentFileIcon,
    Card,
    CardCover,
    CardFooter,
    CardHeader,
    FileAttachment = DefaultFileAttachment,
    FileAttachmentGroup = DefaultFileAttachmentGroup,
    Gallery = DefaultGallery,
    Giphy,
    MessageFooter,
    MessageHeader,
    MessageReplies = DefaultMessageReplies,
    MessageText,
    ReactionList = DefaultReactionList,
    UrlPreview,
    actionSheetStyles,
    actionSheetVisible,
    additionalTouchableProps,
    alignment,
    canDeleteMessage,
    canEditMessage,
    customMessageContent,
    dismissReactionPicker,
    enableLongPress = true,
    formatDate,
    getTotalReactionCount,
    groupStyles,
    handleAction,
    handleDelete,
    handleEdit,
    handleReaction,
    hideReactionCount = false,
    hideReactionOwners = false,
    isMyMessage,
    markdownRules,
    message,
    messageActions,
    onLongPress,
    onPress,
    onThreadSelect,
    openReactionPicker,
    reactionPickerVisible,
    reactionsEnabled = true,
    repliesEnabled = true,
    setActionSheetVisible,
    showActionSheet,
    supportedReactions = emojiData,
    threadList,
  } = props;

  const { disabled } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    Attachment: ContextAttachment,
    Message,
    retrySendMessage,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    theme: {
      colors: { textGrey, transparent },
      message: {
        content: {
          container: { borderRadiusL, borderRadiusS, ...container },
          containerInner,
          deletedContainer,
          deletedText,
          errorContainer: { backgroundColor },
          metaContainer,
          metaText,
        },
      },
    },
  } = useTheme();
  const { openThread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t, tDateTimeParser } = useTranslationContext();

  const Attachment = PropsAttachment || ContextAttachment || DefaultAttachment;

  const actionSheetRef = useRef<ActionSheetCustom>();

  const onOpenThread = () => {
    if (onThreadSelect) {
      onThreadSelect(message);
    } else if (openThread) {
      openThread(message);
    }
  };

  useEffect(() => {
    if (actionSheetVisible && actionSheetRef.current) {
      setTimeout(
        () => {
          actionSheetRef.current?.show?.();
        },
        customMessageContent ? 10 : 0,
      );
    }
  }, [actionSheetVisible]);

  const showTime = groupStyles[0] === 'single' || groupStyles[0] === 'bottom';
  const hasReactions =
    reactionsEnabled &&
    message.latest_reactions &&
    message.latest_reactions.length > 0;
  const images =
    (Array.isArray(message.attachments) &&
      message.attachments.filter(
        (item) =>
          item.type === 'image' && !item.title_link && !item.og_scrape_url,
      )) ||
    [];
  const files =
    (Array.isArray(message.attachments) &&
      message.attachments.filter((item) => item.type === 'file')) ||
    [];

  if (message.deleted_at) {
    return (
      <View
        style={[
          styles.deletedContainer,
          ...(alignment === 'left'
            ? [styles.leftAlignContent, styles.leftAlignItems]
            : [styles.rightAlignContent, styles.rightAlignItems]),
          deletedContainer,
        ]}
      >
        <Text
          style={[styles.deletedText, deletedText]}
          testID='message-deleted'
        >
          {t('This message was deleted ...')}
        </Text>
      </View>
    );
  }

  const contentProps = {
    activeOpacity: 0.7,
    disabled,
    hasReactions,
    onLongPress:
      onLongPress && !disabled
        ? (event: GestureResponderEvent) => onLongPress(message, event)
        : enableLongPress
        ? showActionSheet
        : () => null,
    onPress: onPress
      ? (event: GestureResponderEvent) => onPress(message, event)
      : () => null,
    status: message.status,
    ...additionalTouchableProps,
  };

  if (message.status === 'failed') {
    contentProps.onPress = () =>
      retrySendMessage(message as MessageResponse<At, Ch, Co, Me, Re, Us>);
  }

  const context = {
    additionalTouchableProps,
    disabled,
    onLongPress: contentProps.onLongPress,
  };

  const getDateText = (formatter?: (date: TDateTimeParserInput) => string) => {
    if (!message.created_at) return '';

    if (formatter) {
      if (typeof message.created_at === 'string') {
        return formatter(message.created_at);
      } else {
        return formatter(message.created_at.asMutable());
      }
    }

    let parserOutput;

    if (typeof message.created_at === 'string') {
      parserOutput = tDateTimeParser(message.created_at);
    } else {
      parserOutput = tDateTimeParser(message.created_at.asMutable());
    }

    if (isDayOrMoment(parserOutput)) {
      return parserOutput.format('LT');
    }
    return message.created_at;
  };

  const error = message.type === 'error' || message.status === 'failed';

  return (
    <MessageContentProvider value={context}>
      <TouchableOpacity
        {...contentProps}
        /**
         * Border radii are useful for the case of error message types only.
         * Otherwise background is transparent, so border radius is not really visible.
         */
        style={[
          styles.container,
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
          error
            ? { backgroundColor, padding: 5 }
            : { backgroundColor: transparent, padding: 0 },
          container,
        ]}
        testID='message-content-wrapper'
      >
        {message.type === 'error' && (
          <Text style={styles.failedText} testID='message-error'>
            {t('ERROR · UNSENT')}
          </Text>
        )}
        {message.status === 'failed' && (
          <Text style={styles.failedText} testID='message-failed'>
            {t('Message failed - try again')}
          </Text>
        )}
        {reactionsEnabled && ReactionList && (
          <ReactionPickerWrapper<At, Ch, Co, Ev, Me, Re, Us>
            alignment={alignment}
            customMessageContent={customMessageContent}
            dismissReactionPicker={dismissReactionPicker}
            handleReaction={handleReaction}
            hideReactionCount={hideReactionCount}
            hideReactionOwners={hideReactionOwners}
            message={message}
            offset={{
              left: 10,
              right: 10,
              top: 0,
            }}
            openReactionPicker={openReactionPicker}
            reactionPickerVisible={reactionPickerVisible}
            supportedReactions={supportedReactions}
          >
            {message.latest_reactions &&
              message.latest_reactions.length > 0 && (
                <ReactionList<At, Ch, Co, Me, Re, Us>
                  alignment={alignment}
                  getTotalReactionCount={getTotalReactionCount}
                  latestReactions={
                    message.latest_reactions as LatestReactions<
                      At,
                      Ch,
                      Co,
                      Me,
                      Re,
                      Us
                    >
                  }
                  supportedReactions={supportedReactions}
                  visible={!reactionPickerVisible}
                />
              )}
          </ReactionPickerWrapper>
        )}
        {MessageHeader && <MessageHeader testID='message-header' {...props} />}
        {/* TODO: Look at this in production: Reason for collapsible: https://github.com/facebook/react-native/issues/12966 */}
        <View
          collapsable={false}
          style={[
            alignment === 'left'
              ? styles.leftAlignItems
              : styles.rightAlignItems,
            containerInner,
          ]}
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
                <Attachment<At>
                  actionHandler={handleAction}
                  alignment={alignment}
                  attachment={attachment}
                  AttachmentActions={AttachmentActions}
                  Card={Card}
                  CardCover={CardCover}
                  CardFooter={CardFooter}
                  CardHeader={CardHeader}
                  FileAttachment={FileAttachment}
                  Giphy={Giphy}
                  key={`${message.id}-${index}`}
                  UrlPreview={UrlPreview}
                />
              );
            })}
          {files.length > 0 && (
            <FileAttachmentGroup<At>
              alignment={alignment}
              AttachmentActions={AttachmentActions}
              AttachmentFileIcon={AttachmentFileIcon}
              FileAttachment={FileAttachment}
              files={files}
              handleAction={handleAction}
              messageId={message.id}
            />
          )}
          {images.length > 0 && (
            <Gallery<At> alignment={alignment} images={images} />
          )}
          <MessageTextContainer<At, Ch, Co, Ev, Me, Re, Us>
            alignment={alignment}
            disabled={message.status === 'failed' || message.type === 'error'}
            groupStyles={groupStyles}
            handleReaction={handleReaction}
            isMyMessage={isMyMessage}
            markdownRules={markdownRules}
            message={message}
            Message={Message}
            MessageText={MessageText}
            openThread={onOpenThread}
          />
        </View>
        {repliesEnabled && (
          <MessageReplies<At, Ch, Co, Ev, Me, Re, Us>
            alignment={alignment}
            isThreadList={!!threadList}
            message={message}
            openThread={onOpenThread}
          />
        )}
        {MessageFooter && (
          <MessageFooter
            testID='message-footer'
            {...props}
            supportedReactions={supportedReactions}
          />
        )}
        {!MessageFooter && showTime && (
          <View
            style={[styles.metaContainer, metaContainer]}
            testID='show-time'
          >
            <Text
              style={[
                styles.metaText,
                { color: textGrey, textAlign: alignment },
                metaText,
              ]}
            >
              {getDateText(formatDate)}
            </Text>
          </View>
        )}
        {actionSheetVisible && enableLongPress && (
          <ActionSheet
            actionSheetStyles={actionSheetStyles}
            canDeleteMessage={canDeleteMessage}
            canEditMessage={canEditMessage}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            messageActions={messageActions}
            openReactionPicker={openReactionPicker}
            openThread={onOpenThread}
            reactionsEnabled={reactionsEnabled}
            ref={actionSheetRef}
            repliesEnabled={repliesEnabled}
            setActionSheetVisible={setActionSheetVisible}
            threadList={threadList}
          />
        )}
      </TouchableOpacity>
    </MessageContentProvider>
  );
};

MessageContent.displayName = 'MessageContent{message{content}}';
