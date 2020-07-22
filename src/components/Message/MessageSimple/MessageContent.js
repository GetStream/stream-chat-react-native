import React from 'react';
import styled from '@stream-io/styled-components';
import Immutable from 'seamless-immutable';
import PropTypes from 'prop-types';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import {
  MessageContentContext,
  withTranslationContext,
} from '../../../context';
import { themed } from '../../../styles/theme';

import {
  Attachment,
  Gallery,
  FileAttachment,
  FileAttachmentGroup,
} from '../../Attachment';
import { ReactionList, ReactionPickerWrapper } from '../../Reaction';

import MessageTextContainer from './MessageTextContainer';
import MessageReplies from './MessageReplies';

import { emojiData, MESSAGE_ACTIONS } from '../../../utils';

// Border radii are useful for the case of error message types only.
// Otherwise background is transparent, so border radius is not really visible.
const Container = styled.TouchableOpacity`
  display: flex;
  flex-direction: column;
  max-width: 250;
  padding: ${({ error }) => (error ? 5 : 0)}px;
  align-items: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  background-color: ${({ error, theme }) =>
    error
      ? theme.message.content.errorContainer.backgroundColor
      : theme.colors.transparent};
  border-bottom-left-radius: ${({ alignment, theme }) =>
    alignment === 'left'
      ? theme.message.content.container.borderRadiusS
      : theme.message.content.container.borderRadiusL};
  border-bottom-right-radius: ${({ alignment, theme }) =>
    alignment === 'left'
      ? theme.message.content.container.borderRadiusL
      : theme.message.content.container.borderRadiusS};
  border-top-left-radius: ${({ theme }) =>
    theme.message.content.container.borderRadiusL};
  border-top-right-radius: ${({ theme }) =>
    theme.message.content.container.borderRadiusL};
  ${({ theme }) => theme.message.content.container.css};
`;

const ContainerInner = styled.View`
  align-items: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  ${({ theme }) => theme.message.content.containerInner.css}
`;

const MetaContainer = styled.View`
  margin-top: 2;
  ${({ theme }) => theme.message.content.metaContainer.css};
`;

const MetaText = styled.Text`
  font-size: 11;
  color: ${({ theme }) => theme.colors.textGrey};
  text-align: ${({ alignment }) => (alignment === 'left' ? 'left' : 'right')};
  ${({ theme }) => theme.message.content.metaText.css};
`;

const DeletedContainer = styled.View`
  display: flex;
  flex-direction: column;
  max-width: 250;
  padding: 5px;
  align-items: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  ${({ theme }) => theme.message.content.deletedContainer.css};
`;

const DeletedText = styled.Text`
  font-size: 15;
  line-height: 20;
  color: #a4a4a4;
  ${({ theme }) => theme.message.content.deletedText.css};
`;

const FailedText = styled.Text`
  color: #a4a4a4;
  margin-right: 5px;
`;

const ActionSheetTitleContainer = styled.View`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  ${({ theme }) => theme.message.actionSheet.titleContainer.css};
`;

const ActionSheetTitleText = styled.Text`
  color: #757575;
  font-size: 14;
  ${({ theme }) => theme.message.actionSheet.titleText.css};
`;

const ActionSheetButtonContainer = styled.View`
  height: 50;
  width: 100%;
  align-items: center;
  background-color: #fff;
  justify-content: center;
  ${({ theme }) => theme.message.actionSheet.buttonContainer.css};
`;

const ActionSheetButtonText = styled.Text`
  font-size: 18;
  color: #388cea;
  ${({ theme }) => theme.message.actionSheet.buttonText.css};
`;

const ActionSheetCancelButtonContainer = styled.View`
  height: 50;
  width: 100%;
  align-items: center;
  justify-content: center;
  ${({ theme }) => theme.message.actionSheet.cancelButtonContainer.css};
`;
const ActionSheetCancelButtonText = styled.Text`
  font-size: 18;
  color: red;
  ${({ theme }) => theme.message.actionSheet.cancelButtonText.css};
`;

class MessageContent extends React.PureComponent {
  static themePath = 'message.content';

  static propTypes = {
    /** @see See [channel context](#channelcontext) */
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /** enabled reactions, this is usually set by the parent component based on channel configs */
    reactionsEnabled: PropTypes.bool.isRequired,
    /** enabled replies, this is usually set by the parent component based on channel configs */
    repliesEnabled: PropTypes.bool.isRequired,
    /**
     * Handler to open the thread on message. This is callback for touch event for replies button.
     *
     * @param message A message object to open the thread upon.
     * */
    onThreadSelect: PropTypes.func,
    /**
     * Callback for onPress event on Message component
     *
     * @param e       Event object for onPress event
     * @param message Message object which was pressed
     *
     * @deprecated Use onPress instead
     * */
    onMessageTouch: PropTypes.func,
    /**
     * Function that overrides default behaviour when message is pressed/touched
     * e.g. if you would like to open reaction picker on message press:
     *
     * ```
     * import { MessageSimple } from 'stream-chat-react-native' // or 'stream-chat-expo'
     * ...
     * const MessageUIComponent = (props) => {
     *  return (
     *    <MessageSimple
     *      {...props}
     *      onPress={(thisArg, message, e) => {
     *        props.openReactionPicker();
     *        // Or if you want to open actionsheet
     *        // thisArg.showActionSheet();
     *      }}
     *  )
     * }
     * ```
     *
     * Similarly, you can also call other methods available on MessageContent
     * component such as handleEdit, handleDelete, showActionSheet etc.
     *
     * Source - [MessageContent](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageContent.js)
     *
     * @param {Component} thisArg Reference to MessageContent component
     * @param message Message object which was pressed
     * @param e       Event object for onPress event
     * */
    onPress: PropTypes.func,
    /**
     * Function that overrides default behaviour when message is long pressed
     * e.g.
     *
     * if you would like to open reaction picker on message long press:
     *
     * ```
     * import { MessageSimple } from 'stream-chat-react-native' // or 'stream-chat-expo'
     * ...
     * const MessageUIComponent = (props) => {
     *  return (
     *    <MessageSimple
     *      {...props}
     *      onLongPress={(thisArg, message, e) => {
     *        props.openReactionPicker();
     *        // Or if you want to open actionsheet
     *        // thisArg.showActionSheet();
     *      }}
     *  )
     * }
     *
     * Similarly, you can also call other methods available on MessageContent
     * component such as handleEdit, handleDelete, showActionSheet etc.
     *
     * Source - [MessageContent](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageContent.js)
     *
     * By default we show action sheet with all the message actions on long press.
     * ```
     *
     * @param {Component} thisArg Reference to MessageContent component
     * @param message Message object which was long pressed
     * @param e       Event object for onLongPress event
     * */
    onLongPress: PropTypes.func,
    /**
     * Handler to delete a current message.
     */
    handleDelete: PropTypes.func,
    /**
     * Handler to edit a current message. This message simply sets current message as value of `editing` property of channel context.
     * `editing` prop is then used by MessageInput component to switch to edit mode.
     */
    handleEdit: PropTypes.func,
    // enable hiding reaction count from reaction picker
    hideReactionCount: PropTypes.bool,
    // enable hiding reaction owners from reaction picker
    hideReactionOwners: PropTypes.bool,
    /** @see See [keyboard context](https://getstream.io/chat/docs/#keyboardcontext) */
    dismissKeyboard: PropTypes.func,
    /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
    handleAction: PropTypes.func,
    /** Position of message. 'right' | 'left' */
    alignment: PropTypes.oneOf(['right', 'left']),
    /**
     * Position of message in group - top, bottom, middle, single.
     *
     * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
     * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
     */
    groupStyles: PropTypes.array,
    /**
     * Provide any additional props for `TouchableOpacity` which wraps `MessageContent` component here.
     * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
     */
    additionalTouchableProps: PropTypes.object,
    /**
     * Style object for actionsheet (used to message actions).
     * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
     */
    actionSheetStyles: PropTypes.object,
    MessageReplies: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    MessageHeader: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    MessageFooter: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to display reaction list.
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/ReactionList.js
     */
    ReactionList: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * e.g.,
     * [
     *  {
     *    id: 'like',
     *    icon: '👍',
     *  },
     *  {
     *    id: 'love',
     *    icon: '❤️️',
     *  },
     *  {
     *    id: 'haha',
     *    icon: '😂',
     *  },
     *  {
     *    id: 'wow',
     *    icon: '😮',
     *  },
     * ]
     */
    supportedReactions: PropTypes.array,
    /** Open the reaction picker */
    openReactionPicker: PropTypes.func,
    /** Dismiss the reaction picker */
    dismissReactionPicker: PropTypes.func,
    /** Boolean - if reaction picker is visible. Hides the reaction list in that case */
    reactionPickerVisible: PropTypes.bool,
    /** Custom UI component for message text */
    MessageText: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to display enriched url preview.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
     */
    UrlPreview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to display Giphy image.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
     */
    Giphy: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachmentGroup.js
     */
    FileAttachmentGroup: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /**
     * Custom UI component to display File type attachment.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachment.js
     */
    FileAttachment: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /**
     * Custom UI component for attachment icon for type 'file' attachment.
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
     */
    AttachmentFileIcon: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /**
     * Custom UI component to display image attachments.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Gallery.js
     */
    Gallery: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to display generic media type e.g. giphy, url preview etc
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
     */
    Card: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to override default header of Card component.
     * Accepts the same props as Card component.
     */
    CardHeader: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to override default cover (between Header and Footer) of Card component.
     * Accepts the same props as Card component.
     */
    CardCover: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to override default Footer of Card component.
     * Accepts the same props as Card component.
     */
    CardFooter: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
     */
    AttachmentActions: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    formatDate: PropTypes.func,
    /**
     * @deprecated Please use `disabled` instead.
     *
     * Disables the message UI. Which means, message actions, reactions won't work.
     */
    readOnly: PropTypes.bool,
    /** Disables the message UI. Which means, message actions, reactions won't work. */
    disabled: PropTypes.bool,
    /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
    markdownRules: PropTypes.object,
  };

  static defaultProps = {
    Attachment,
    reactionsEnabled: true,
    repliesEnabled: true,
    MessageText: false,
    ReactionList,
    MessageReplies,
    Gallery,
    FileAttachment,
    FileAttachmentGroup,
    supportedReactions: emojiData,
    hideReactionCount: false,
    hideReactionOwners: false,
  };

  constructor(props) {
    super(props);

    this.ActionSheet = false;
    this.state = {};
  }

  openThread = () => {
    if (this.props.onThreadSelect)
      this.props.onThreadSelect(this.props.message);
  };

  showActionSheet = () => {
    this.props.dismissKeyboard();
    this.ActionSheet.show();
  };

  handleDelete = async () => {
    await this.props.handleDelete();
  };

  handleEdit = () => {
    this.props.handleEdit();
  };

  /**
   * @todo: Remove the method in future 1.0.0.
   * This method has been moved to `ReactionPickerWrapper`.
   *
   * @deprecated
   */
  _setReactionPickerPosition = async () => {
    console.warn(
      'openReactionSelector has been deprecared and will be removed in next major release.' +
        'Please use this.props.openReactionPicker instead.',
    );

    await this.props.openReactionPicker();
  };

  openReactionSelector = async () => {
    console.warn(
      'openReactionSelector has been deprecared and will be removed in next major release.' +
        'Please use this.props.openReactionPicker instead.',
    );

    await this.props.openReactionPicker();
  };

  onActionPress = (action) => {
    switch (action) {
      case MESSAGE_ACTIONS.edit:
        this.handleEdit();
        break;
      case MESSAGE_ACTIONS.delete:
        this.handleDelete();
        break;
      case MESSAGE_ACTIONS.reply:
        this.openThread();
        break;
      case MESSAGE_ACTIONS.reactions:
        this.props.openReactionPicker();
        break;
      default:
        break;
    }
  };

  render() {
    const {
      alignment,
      message,
      isMyMessage,
      readOnly,
      disabled,
      Message,
      ReactionList,
      handleReaction,
      hideReactionCount,
      hideReactionOwners,
      threadList,
      retrySendMessage,
      messageActions,
      groupStyles,
      additionalTouchableProps,
      reactionsEnabled,
      getTotalReactionCount,
      repliesEnabled,
      canEditMessage,
      canDeleteMessage,
      MessageHeader,
      MessageFooter,
      supportedReactions,
      openReactionPicker,
      dismissReactionPicker,
      reactionPickerVisible,
      handleAction,
      AttachmentFileIcon,
      MessageText,
      channel,
      MessageReplies,
      AttachmentActions,
      Card,
      CardHeader,
      CardCover,
      CardFooter,
      UrlPreview,
      Giphy,
      Gallery,
      FileAttachment,
      FileAttachmentGroup,
      t,
      tDateTimeParser,
      markdownRules,
    } = this.props;

    const Attachment = this.props.Attachment;
    const hasAttachment = Boolean(
      message && message.attachments && message.attachments.length,
    );

    const showTime = groupStyles[0] === 'single' || groupStyles[0] === 'bottom';

    const hasReactions =
      reactionsEnabled &&
      message.latest_reactions &&
      message.latest_reactions.length > 0;

    const options = [{ id: 'cancel', title: 'Cancel' }];
    const images =
      hasAttachment &&
      message.attachments.filter(
        (item) =>
          item.type === 'image' && !item.title_link && !item.og_scrape_url,
      );

    const files =
      hasAttachment &&
      message.attachments.filter((item) => item.type === 'file');

    if (
      messageActions &&
      reactionsEnabled &&
      messageActions.indexOf(MESSAGE_ACTIONS.reactions) > -1
    ) {
      options.splice(1, 0, {
        id: MESSAGE_ACTIONS.reactions,
        title: t('Add Reaction'),
      });
    }

    if (
      messageActions &&
      repliesEnabled &&
      messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 &&
      !threadList
    ) {
      options.splice(1, 0, { id: MESSAGE_ACTIONS.reply, title: t('Reply') });
    }
    if (
      messageActions &&
      messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 &&
      canEditMessage()
    )
      options.splice(1, 0, {
        id: MESSAGE_ACTIONS.edit,
        title: t('Edit Message'),
      });

    if (
      messageActions &&
      messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 &&
      canDeleteMessage()
    )
      options.splice(1, 0, {
        id: MESSAGE_ACTIONS.delete,
        title: t('Delete Message'),
      });

    if (message.deleted_at)
      return (
        <DeletedContainer alignment={alignment}>
          <DeletedText>{t('This message was deleted ...')}</DeletedText>
        </DeletedContainer>
      );

    const onLongPress = this.props.onLongPress;
    const contentProps = {
      alignment,
      status: message.status,
      onPress: this.props.onPress
        ? this.props.onPress.bind(this, this, message)
        : this.props.onMessageTouch,
      onLongPress:
        onLongPress && !(disabled || readOnly)
          ? onLongPress.bind(this, this, message)
          : options.length > 1 && !(disabled || readOnly)
          ? this.showActionSheet
          : () => null,
      activeOpacity: 0.7,
      disabled: disabled || readOnly,
      hasReactions,
      ...additionalTouchableProps,
    };

    if (message.status === 'failed')
      contentProps.onPress = retrySendMessage.bind(this, Immutable(message));

    const context = {
      onLongPress: contentProps.onLongPress,
      disabled: disabled || readOnly,
      additionalTouchableProps,
    };

    return (
      <MessageContentContext.Provider value={context}>
        <Container
          {...contentProps}
          error={message.type === 'error' || message.status === 'failed'}
        >
          {message.type === 'error' ? (
            <FailedText>{t('ERROR · UNSENT')}</FailedText>
          ) : null}
          {message.status === 'failed' ? (
            <FailedText>{t('Message failed - try again')}</FailedText>
          ) : null}
          {reactionsEnabled && ReactionList && (
            <ReactionPickerWrapper
              reactionPickerVisible={reactionPickerVisible}
              handleReaction={handleReaction}
              hideReactionCount={hideReactionCount}
              hideReactionOwners={hideReactionOwners}
              openReactionPicker={openReactionPicker}
              dismissReactionPicker={dismissReactionPicker}
              message={message}
              alignment={alignment}
              offset={{
                top: 25,
                left: 10,
                right: 10,
              }}
              supportedReactions={supportedReactions}
            >
              {message.latest_reactions &&
                message.latest_reactions.length > 0 && (
                  <ReactionList
                    alignment={alignment}
                    visible={!reactionPickerVisible}
                    latestReactions={message.latest_reactions}
                    getTotalReactionCount={getTotalReactionCount}
                    reactionCounts={message.reaction_counts}
                    supportedReactions={supportedReactions}
                  />
                )}
            </ReactionPickerWrapper>
          )}
          {MessageHeader && <MessageHeader {...this.props} />}
          {/* Reason for collapsible: https://github.com/facebook/react-native/issues/12966 */}
          <ContainerInner
            alignment={alignment}
            ref={(o) => (this.messageContainer = o)}
            collapsable={false}
          >
            {hasAttachment &&
              message.attachments.map((attachment, index) => {
                // We handle files separately
                if (attachment.type === 'file') return null;
                if (
                  attachment.type === 'image' &&
                  !attachment.title_link &&
                  !attachment.og_scrape_url
                )
                  return null;
                return (
                  <Attachment
                    key={`${message.id}-${index}`}
                    attachment={attachment}
                    actionHandler={handleAction}
                    alignment={alignment}
                    UrlPreview={UrlPreview}
                    Giphy={Giphy}
                    Card={Card}
                    FileAttachment={FileAttachment}
                    AttachmentActions={AttachmentActions}
                    CardHeader={CardHeader}
                    CardCover={CardCover}
                    CardFooter={CardFooter}
                  />
                );
              })}
            {files && files.length > 0 && (
              <FileAttachmentGroup
                messageId={message.id}
                files={files}
                handleAction={handleAction}
                alignment={alignment}
                AttachmentFileIcon={AttachmentFileIcon}
                FileAttachment={FileAttachment}
                AttachmentActions={AttachmentActions}
              />
            )}
            {images && images.length > 0 && (
              <Gallery alignment={alignment} images={images} />
            )}
            <MessageTextContainer
              message={message}
              groupStyles={groupStyles}
              isMyMessage={isMyMessage}
              MessageText={MessageText}
              disabled={message.status === 'failed' || message.type === 'error'}
              alignment={alignment}
              Message={Message}
              openThread={this.openThread}
              handleReaction={handleReaction}
              markdownRules={markdownRules}
            />
          </ContainerInner>
          {repliesEnabled ? (
            <MessageReplies
              message={message}
              isThreadList={!!threadList}
              openThread={this.openThread}
              alignment={alignment}
              channel={channel}
            />
          ) : null}
          {MessageFooter && <MessageFooter {...this.props} />}
          {!MessageFooter && showTime ? (
            <MetaContainer>
              <MetaText alignment={alignment}>
                {this.props.formatDate
                  ? this.props.formatDate(message.created_at)
                  : tDateTimeParser(message.created_at).format('LT')}
              </MetaText>
            </MetaContainer>
          ) : null}
          <ActionSheet
            ref={(o) => {
              this.ActionSheet = o;
            }}
            title={
              <ActionSheetTitleContainer>
                <ActionSheetTitleText>
                  {t('Choose an action')}
                </ActionSheetTitleText>
              </ActionSheetTitleContainer>
            }
            options={[
              ...options.map((o, i) => {
                if (i === 0) {
                  return (
                    <ActionSheetCancelButtonContainer>
                      <ActionSheetCancelButtonText>
                        {t('Cancel')}
                      </ActionSheetCancelButtonText>
                    </ActionSheetCancelButtonContainer>
                  );
                }
                return (
                  <ActionSheetButtonContainer key={o.title}>
                    <ActionSheetButtonText>{o.title}</ActionSheetButtonText>
                  </ActionSheetButtonContainer>
                );
              }),
            ]}
            cancelButtonIndex={0}
            destructiveButtonIndex={0}
            onPress={(index) => this.onActionPress(options[index].id)}
            styles={this.props.actionSheetStyles}
          />
        </Container>
      </MessageContentContext.Provider>
    );
  }
}

export default withTranslationContext(themed(MessageContent));
