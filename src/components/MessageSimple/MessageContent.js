import React from 'react';
import { Dimensions, Text } from 'react-native';
import moment from 'moment';
import { MessageContentContext } from '../../context';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';
import { Attachment } from '../Attachment';
import { ReactionList } from '../ReactionList';
import { ReactionPicker } from '../ReactionPicker';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';
import { MessageText } from './MessageText';
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
      ? theme.message.text.borderRadiusS
      : theme.message.text.borderRadiusL};
  border-bottom-right-radius: ${({ alignment, theme }) =>
    alignment === 'left'
      ? theme.message.text.borderRadiusL
      : theme.message.text.borderRadiusS};
  border-top-left-radius: ${({ theme }) => theme.message.text.borderRadiusL};
  border-top-right-radius: ${({ theme }) => theme.message.text.borderRadiusL};
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

export const MessageContent = themed(
  class MessageContent extends React.PureComponent {
    static themePath = 'message.content';

    static propTypes = {
      /** enabled reactions, this is usually set by the parent component based on channel configs */
      reactionsEnabled: PropTypes.bool.isRequired,
      /** enabled replies, this is usually set by the parent component based on channel configs */
      repliesEnabled: PropTypes.bool.isRequired,
    };

    static defaultProps = {
      reactionsEnabled: true,
      repliesEnabled: true,
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

    onMessageTouch = () => {
      this.props.onMessageTouch(this.props.message.id);
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
        repliesEnabled,
        canEditMessage,
        canDeleteMessage,
      } = this.props;
      const hasAttachment = Boolean(
        message && message.attachments && message.attachments.length,
      );

      const pos = isMyMessage(message) ? 'right' : 'left';

      const showTime =
        groupStyles[0] === 'single' || groupStyles[0] === 'bottom'
          ? true
          : false;

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
          title: 'Add Reaction',
        });
      }

      if (
        messageActions &&
        repliesEnabled &&
        messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 &&
        !threadList
      ) {
        options.splice(1, 0, { id: MESSAGE_ACTIONS.reply, title: 'Reply' });
      }
      if (
        messageActions &&
        messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 &&
        canEditMessage()
      )
        options.splice(1, 0, {
          id: MESSAGE_ACTIONS.edit,
          title: 'Edit Message',
        });

      if (
        messageActions &&
        messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 &&
        canDeleteMessage()
      )
        options.splice(1, 0, {
          id: MESSAGE_ACTIONS.delete,
          title: 'Delete Message',
        });

      if (message.deleted_at)
        return (
          <DeletedContainer alignment={pos}>
            <DeletedText>This message was deleted ...</DeletedText>
          </DeletedContainer>
        );

      const contentProps = {
        alignment: pos,
        status: message.status,
        onLongPress: options.length > 1 ? this.showActionSheet : null,
        activeOpacity: 0.7,
        disabled: readOnly,
        hasReactions,
      };

      if (message.status === 'failed')
        contentProps.onPress = retrySendMessage.bind(this, Immutable(message));

      const context = {
        onLongPress: options.length > 1 ? this.showActionSheet : null,
      };

      return (
        <MessageContentContext.Provider value={context}>
          <Container
            {...contentProps}
            error={message.type === 'error' || message.status === 'failed'}
          >
            {message.type === 'error' ? (
              <FailedText>ERROR · UNSENT</FailedText>
            ) : null}
            {message.status === 'failed' ? (
              <FailedText>Message failed - try again</FailedText>
            ) : null}
            {reactionsEnabled &&
              message.latest_reactions &&
              message.latest_reactions.length > 0 && (
                <ReactionList
                  position={pos}
                  visible={!this.state.reactionPickerVisible}
                  latestReactions={message.latest_reactions}
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
                />
              )}
              {images && images.length > 0 && (
                <Gallery alignment={this.props.alignment} images={images} />
              )}
              <MessageText
                message={message}
                groupStyles={hasReactions ? ['top'] : groupStyles}
                isMyMessage={isMyMessage}
                disabled={
                  message.status === 'failed' || message.type === 'error'
                }
                onMessageTouch={this.onMessageTouch}
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

            {showTime ? (
              <MetaContainer>
                <MetaText alignment={pos}>
                  {moment(message.created_at).format('h:mmA')}
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
              />
            ) : null}
            <ActionSheet
              ref={(o) => {
                this.ActionSheet = o;
              }}
              title={<Text>Choose an action</Text>}
              options={options.map((o) => o.title)}
              cancelButtonIndex={0}
              destructiveButtonIndex={0}
              onPress={(index) => this.onActionPress(options[index].id)}
            />
          </Container>
        </MessageContentContext.Provider>
      );
    }
  },
);
