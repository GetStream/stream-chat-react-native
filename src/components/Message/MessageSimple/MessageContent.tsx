import React, { useEffect, useRef } from 'react';

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
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import {
  isDayOrMoment,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';
import { styled } from '../../../styles/styledComponents';
import { emojiData } from '../../../utils/utils';

import type { GestureResponderEvent } from 'react-native';
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

/**
 * Border radii are useful for the case of error message types only.
 * Otherwise background is transparent, so border radius is not really visible.
 */
const Container = styled.TouchableOpacity<{
  alignment: Alignment;
  error: boolean;
}>`
  align-items: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  background-color: ${({ error, theme }) =>
    error
      ? theme.message.content.errorContainer.backgroundColor
      : theme.colors.transparent};
  border-bottom-left-radius: ${({ alignment, theme }) =>
    alignment === 'left'
      ? theme.message.content.container.borderRadiusS
      : theme.message.content.container.borderRadiusL}px;
  border-bottom-right-radius: ${({ alignment, theme }) =>
    alignment === 'left'
      ? theme.message.content.container.borderRadiusL
      : theme.message.content.container.borderRadiusS}px;
  border-top-left-radius: ${({ theme }) =>
    theme.message.content.container.borderRadiusL}px;
  border-top-right-radius: ${({ theme }) =>
    theme.message.content.container.borderRadiusL}px;
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  max-width: 250px;
  padding: ${({ error }) => (error ? 5 : 0)}px;
  ${({ theme }) => theme.message.content.container.css};
`;

const ContainerInner = styled.View<{ alignment: Alignment }>`
  align-items: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  ${({ theme }) => theme.message.content.containerInner.css}
`;

const DeletedContainer = styled.View<{ alignment: Alignment }>`
  align-items: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  max-width: 250px;
  padding: 5px;
  ${({ theme }) => theme.message.content.deletedContainer.css};
`;

const DeletedText = styled.Text`
  color: #a4a4a4;
  font-size: 15px;
  line-height: 20px;
  ${({ theme }) => theme.message.content.deletedText.css};
`;

const FailedText = styled.Text`
  color: #a4a4a4;
  margin-right: 5px;
`;

const MetaContainer = styled.View`
  margin-top: 2px;
  ${({ theme }) => theme.message.content.metaContainer.css};
`;

const MetaText = styled.Text<{ alignment: Alignment }>`
  color: ${({ theme }) => theme.colors.textGrey};
  font-size: 11px;
  text-align: ${({ alignment }) => alignment};
  ${({ theme }) => theme.message.content.metaText.css};
`;

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
  disabled?: boolean;
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
  textBeforeAttachments?: boolean;
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
    textBeforeAttachments = false,
    disabled: disabledFromProps,
  } = props;

  const { disabled: disabledFromContext } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const disabled = disabledFromProps || disabledFromContext;
  const {
    Attachment: ContextAttachment,
    Message,
    retrySendMessage,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
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
      <DeletedContainer alignment={alignment}>
        <DeletedText testID='message-deleted'>
          {t('This message was deleted ...')}
        </DeletedText>
      </DeletedContainer>
    );
  }

  const contentProps = {
    activeOpacity: 0.7,
    alignment,
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
        return formatter(message.created_at && message.created_at.asMutable && message.created_at.asMutable());
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

  const renderAttachments = () => (
    <>
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
    </>
  );
  return (
    <MessageContentProvider value={context}>
      <Container
        {...contentProps}
        error={message.type === 'error' || message.status === 'failed'}
        testID='message-content-wrapper'
      >
        {message.type === 'error' && (
          <FailedText testID='message-error'>{t('ERROR · UNSENT')}</FailedText>
        )}
        {message.status === 'failed' && (
          <FailedText testID='message-failed'>
            {t('Message failed - try again')}
          </FailedText>
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
        <ContainerInner alignment={alignment} collapsable={false}>
          {!textBeforeAttachments && renderAttachments()}
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
          {textBeforeAttachments && renderAttachments()}
        </ContainerInner>
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
          <MetaContainer testID='show-time'>
            <MetaText alignment={alignment}>{getDateText(formatDate)}</MetaText>
          </MetaContainer>
        )}
        {actionSheetVisible && enableLongPress && (
          <ActionSheet
            actionSheetStyles={actionSheetStyles}
            canDeleteMessage={canDeleteMessage}
            canEditMessage={canEditMessage}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            handleReaction={handleReaction}
            message={message}
            messageActions={messageActions}
            openReactionPicker={openReactionPicker}
            openThread={onOpenThread}
            reactionsEnabled={reactionsEnabled}
            ref={actionSheetRef}
            repliesEnabled={repliesEnabled}
            setActionSheetVisible={setActionSheetVisible}
            supportedReactions={emojiData}
            threadList={threadList}
          />
        )}
      </Container>
    </MessageContentProvider>
  );
};
