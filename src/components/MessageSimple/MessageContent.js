import React from 'react';
import { Dimensions } from 'react-native';
import moment from 'moment';
import { MessageContentContext, withTranslationContext } from '../../context';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';
import { Attachment } from '../Attachment';
import { ReactionList } from '../ReactionList';
import { ReactionPicker } from '../ReactionPicker';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';
import { MessageTextContainer } from './MessageTextContainer';
import { MessageReplies } from './MessageReplies';
import { Gallery } from '../Gallery';
import { MESSAGE_ACTIONS } from '../../utils';
import Immutable from 'seamless-immutable';
import PropTypes from 'prop-types';
import { FileAttachmentGroup } from '../FileAttachmentGroup';

// Border radii are useful for the case of error message types only.
// Otherwise background is transperant, so border radius is not really visible.
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
     *        thisArg.openReactionSelector();
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
     * e.g. if you would like to open reaction picker on message long press:
     *
     * ```
     * import { MessageSimple } from 'stream-chat-react-native' // or 'stream-chat-expo'
     * ...
     * const MessageUIComponent = (props) => {
     *  return (
     *    <MessageSimple
     *      {...props}
     *      onLongPress={(thisArg, message, e) => {
     *        thisArg.openReactionSelector();
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
    /** @see See [keyboard context](https://getstream.io/chat/docs/#keyboardcontext) */
    dismissKeyboard: PropTypes.func,
    /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
    handleAction: PropTypes.func,
    /** Position of message. 'right' | 'left' */
    alignment: PropTypes.string,
    /**
     * Position of message in group - top, bottom, middle, single.
     *
     * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
     * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
     */
    groupStyles: PropTypes.array,
    /**
     * Style object for actionsheet (used to message actions).
     * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
     */
    actionSheetStyles: PropTypes.object,
    /**
     * Custom UI component for attachment icon for type 'file' attachment.
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
     */
    AttachmentFileIcon: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    formatDate: PropTypes.func,
  };

  static defaultProps = {
    Attachment,
    reactionsEnabled: true,
    repliesEnabled: true,
    MessageText: false,
  };

  constructor(props) {
    super(props);

    this.ActionSheet = false;
    this.state = { reactionPickerVisible: false };
  }

  openThread = () => {
    if (this.props.onThreadSelect)
      this.props.onThreadSelect(this.props.message);
  };

  showActionSheet = () => {
    this.ActionSheet.show();
  };

  handleDelete = async () => {
    await this.props.handleDelete();
  };

  handleEdit = () => {
    this.props.handleEdit();
  };

  _setReactionPickerPosition = () => {
    const { isMyMessage, message } = this.props;
    const pos = isMyMessage(message) ? 'right' : 'left';
    this.messageContainer.measureInWindow((x, y, width) => {
      this.setState({
        reactionPickerVisible: true,
        rpTop: y - 60,
        rpLeft: pos === 'left' ? x - 10 : null,
        rpRight:
          pos === 'right'
            ? Math.round(Dimensions.get('window').width) - (x + width + 10)
            : null,
      });
    });
  };

  openReactionSelector = async () => {
    const { readOnly } = this.props;

    if (readOnly) return;

    // Keyboard closes automatically whenever modal is opened (currently there is no way of avoiding this afaik)
    // So we need to postpone the calculation for reaction picker position
    // until after keyboard is closed completely. To achieve this, we close
    // the keyboard forcefully and then calculate position of picker in callback.
    await this.props.dismissKeyboard();
    this._setReactionPickerPosition();
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
        this.openReactionSelector();
        break;
      default:
        break;
    }
  };

  render() {
    const {
      message,
      isMyMessage,
      readOnly,
      Message,
      handleReaction,
      threadList,
      retrySendMessage,
      messageActions,
      groupStyles,
      reactionsEnabled,
      getTotalReactionCount,
      repliesEnabled,
      canEditMessage,
      canDeleteMessage,
      MessageFooter,
      t,
    } = this.props;

    const Attachment = this.props.Attachment;
    const hasAttachment = Boolean(
      message && message.attachments && message.attachments.length,
    );

    const pos = isMyMessage(message) ? 'right' : 'left';

    const showTime =
      groupStyles[0] === 'single' || groupStyles[0] === 'bottom' ? true : false;

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
        <DeletedContainer alignment={pos}>
          <DeletedText>{t('This message was deleted ...')}</DeletedText>
        </DeletedContainer>
      );

    const onLongPress = this.props.onLongPress;
    const contentProps = {
      alignment: pos,
      status: message.status,
      onPress: this.props.onPress
        ? this.props.onPress.bind(this, this, message)
        : this.props.onMessageTouch,
      onLongPress: onLongPress
        ? onLongPress.bind(this, this, message)
        : options.length > 1
        ? this.showActionSheet
        : null,
      activeOpacity: 0.7,
      disabled: readOnly,
      hasReactions,
    };

    if (message.status === 'failed')
      contentProps.onPress = retrySendMessage.bind(this, Immutable(message));

    const context = {
      onLongPress: contentProps.onLongPress,
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
          {reactionsEnabled &&
            message.latest_reactions &&
            message.latest_reactions.length > 0 && (
              <ReactionList
                position={pos}
                visible={!this.state.reactionPickerVisible}
                latestReactions={message.latest_reactions}
                getTotalReactionCount={getTotalReactionCount}
                openReactionSelector={this.openReactionSelector}
                reactionCounts={message.reaction_counts}
              />
            )}
          {/* Reason for collapsible: https://github.com/facebook/react-native/issues/12966 */}
          <ContainerInner
            alignment={pos}
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
                    actionHandler={this.props.handleAction}
                    alignment={this.props.alignment}
                  />
                );
              })}
            {files && files.length > 0 && (
              <FileAttachmentGroup
                messageId={message.id}
                files={files}
                handleAction={this.props.handleAction}
                alignment={this.props.alignment}
                AttachmentFileIcon={this.props.AttachmentFileIcon}
              />
            )}
            {images && images.length > 0 && (
              <Gallery alignment={this.props.alignment} images={images} />
            )}
            <MessageTextContainer
              message={message}
              groupStyles={hasReactions ? ['top'] : groupStyles}
              isMyMessage={isMyMessage}
              MessageText={this.props.MessageText}
              disabled={message.status === 'failed' || message.type === 'error'}
              Message={Message}
              openThread={this.openThread}
              handleReaction={handleReaction}
            />
          </ContainerInner>
          {repliesEnabled ? (
            <MessageReplies
              message={message}
              isThreadList={!!threadList}
              openThread={this.openThread}
              pos={pos}
            />
          ) : null}
          {MessageFooter && <MessageFooter {...this.props} />}
          {!MessageFooter && showTime ? (
            <MetaContainer>
              <MetaText alignment={pos}>
                {this.props.formatDate
                  ? this.props.formatDate(message.created_at)
                  : moment(message.created_at).format('h:mmA')}
              </MetaText>
            </MetaContainer>
          ) : null}

          {reactionsEnabled ? (
            <ReactionPicker
              reactionPickerVisible={this.state.reactionPickerVisible}
              handleReaction={handleReaction}
              latestReactions={message.latest_reactions}
              reactionCounts={message.reaction_counts}
              handleDismiss={() => {
                this.setState({ reactionPickerVisible: false });
              }}
              rpLeft={this.state.rpLeft}
              rpRight={this.state.rpRight}
              rpTop={this.state.rpTop}
              emojiData={this.props.emojiData}
            />
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

const MessageContentWithContext = withTranslationContext(
  themed(MessageContent),
);

export { MessageContentWithContext as MessageContent };
