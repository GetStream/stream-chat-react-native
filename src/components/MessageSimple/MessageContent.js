import React from 'react';
import { Dimensions, Text } from 'react-native';
import moment from 'moment';
import styled from 'styled-components';
import { REACTION_PICKER_HEIGHT } from '../../styles/styles.js';
import { Attachment } from '../Attachment';
import { ReactionList } from '../ReactionList';
import { ReactionPicker } from '../ReactionPicker';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';
import { MessageText } from './MessageText';
import { MessageReplies } from './MessageReplies';
import { Gallery } from '../Gallery';
import { MESSAGE_ACTIONS } from '../../utils';
import Immutable from 'seamless-immutable';

const Container = styled.TouchableOpacity`
  display: ${(props) => props.theme.messageContent.container.display};
  flex-direction: ${(props) =>
    props.theme.messageContent.container.flexDirection};
  max-width: ${(props) => props.theme.messageContent.container.maxWidth};
  align-items: ${(props) =>
    props.position === 'left'
      ? props.theme.messageContent.container.leftAlignItems
      : props.theme.messageContent.container.rightAlignItems};
  justify-content: ${(props) =>
    props.position === 'left'
      ? props.theme.messageContent.container.leftJustifyContent
      : props.theme.messageContent.container.rightJustifyContent};
`;

const ContainerInner = styled.View`
  align-items: ${(props) =>
    props.theme.messageContent.containerInner.alignItems};
`;

const MetaContainer = styled.View`
  margin-top: ${(props) => props.theme.messageContent.metaContainer.marginTop};
`;

const MetaText = styled.Text`
  font-size: ${(props) => props.theme.messageContent.metaText.fontSize};
  color: ${(props) => props.theme.messageContent.metaText.color};
  text-align: ${(props) =>
    props.position === 'left'
      ? props.theme.messageContent.metaText.leftTextAlign
      : props.theme.messageContent.metaText.rightTextAlign};
`;

const DeletedContainer = styled.View`
  display: ${(props) => props.theme.messageContent.deletedContainer.display};
  flex-direction: ${(props) =>
    props.theme.messageContent.deletedContainer.flexDirection};
  max-width: ${(props) => props.theme.messageContent.deletedContainer.maxWidth};
  padding: ${(props) => props.theme.messageContent.deletedContainer.padding}px;
  align-items: ${(props) =>
    props.position === 'left'
      ? props.theme.messageContent.deletedContainer.leftAlignItems
      : props.theme.messageContent.deletedContainer.rightAlignItems};
  justify-content: ${(props) =>
    props.position === 'left'
      ? props.theme.messageContent.deletedContainer.leftJustifyContent
      : props.theme.messageContent.deletedContainer.rightJustifyContent};
`;

const DeletedText = styled.Text`
  font-size: ${(props) => props.theme.messageContent.deletedText.fontSize};
  line-height: ${(props) => props.theme.messageContent.deletedText.lineHeight};
  color: ${(props) => props.theme.messageContent.deletedText.color};
`;

const FailedText = styled.Text``;

export class MessageContent extends React.PureComponent {
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
    await this.props.Message.handleDelete();
  };

  handleEdit = () => {
    this.props.Message.handleEdit();
  };

  openReactionSelector = () => {
    const { isMyMessage, message } = this.props;
    const pos = isMyMessage(message) ? 'right' : 'left';
    this.messageContainer.measureInWindow((x, y, width) => {
      this.setState({
        reactionPickerVisible: true,
        rpTop: y - REACTION_PICKER_HEIGHT,
        rpLeft: pos === 'left' ? x : null,
        rpRight:
          pos === 'right'
            ? Math.round(Dimensions.get('window').width) - (x + width)
            : null,
      });
    });
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
      activeMessageId,
      Message,
      handleReaction,
      threadList,
      retrySendMessage,
      messageActions,
    } = this.props;
    const hasAttachment = Boolean(
      message && message.attachments && message.attachments.length,
    );

    const pos = isMyMessage(message) ? 'right' : 'left';

    const showTime =
      message.groupPosition[0] === 'single' ||
      message.groupPosition[0] === 'bottom'
        ? true
        : false;

    const options = [{ id: 'cancel', title: 'Cancel' }];
    const images =
      hasAttachment &&
      message.attachments.filter((item) => item.type === 'image');

    if (
      messageActions &&
      messageActions.indexOf(MESSAGE_ACTIONS.reactions) > -1
    ) {
      options.splice(1, 0, {
        id: MESSAGE_ACTIONS.reactions,
        title: 'Add Reaction',
      });
    }

    if (
      messageActions &&
      messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 &&
      !threadList
    ) {
      options.splice(1, 0, { id: MESSAGE_ACTIONS.reply, title: 'Reply' });
    }
    if (
      messageActions &&
      messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 &&
      Message.canEditMessage()
    )
      options.splice(1, 0, { id: MESSAGE_ACTIONS.edit, title: 'Edit Message' });

    if (
      messageActions &&
      messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 &&
      Message.canDeleteMessage()
    )
      options.splice(1, 0, {
        id: MESSAGE_ACTIONS.delete,
        title: 'Delete Message',
      });

    if (message.deleted_at)
      return (
        <DeletedContainer position={pos}>
          <DeletedText>This message was deleted ...</DeletedText>
        </DeletedContainer>
      );

    const contentProps = {
      position: pos,
      status: message.status,
      onLongPress: options.length > 1 ? this.showActionSheet : null,
      activeOpacity: 0.7,
      disabled: readOnly,
    };

    if (message.status === 'failed')
      contentProps.onPress = retrySendMessage.bind(this, Immutable(message));

    return (
      <Container {...contentProps}>
        {message.status === 'failed' ? (
          <FailedText>Message failed - try again</FailedText>
        ) : null}
        {message.latest_reactions && message.latest_reactions.length > 0 && (
          <ReactionList
            visible={!this.state.reactionPickerVisible}
            latestReactions={message.latest_reactions}
            openReactionSelector={this.openReactionSelector}
            reactionCounts={message.reaction_counts}
          />
        )}
        {/* Reason for collapsible: https://github.com/facebook/react-native/issues/12966 */}
        <ContainerInner
          ref={(o) => (this.messageContainer = o)}
          collapsable={false}
        >
          {hasAttachment &&
            images.length <= 1 &&
            message.attachments.map((attachment, index) => (
              <Attachment
                key={`${message.id}-${index}`}
                attachment={attachment}
                actionHandler={this.props.handleAction}
                position={this.props.position}
              />
            ))}
          {images.length > 1 && (
            <Gallery position={this.props.position} images={images} />
          )}
          <MessageText
            message={message}
            isMyMessage={isMyMessage}
            disabled={message.status === 'failed'}
            onMessageTouch={this.onMessageTouch}
            activeMessageId={activeMessageId}
            Message={Message}
            openThread={this.openThread}
            handleReaction={handleReaction}
          />
        </ContainerInner>
        <MessageReplies
          message={message}
          isThreadList={!!threadList}
          openThread={this.openThread}
          pos={pos}
        />

        {showTime ? (
          <MetaContainer>
            <MetaText position={pos}>
              {moment(message.created_at).format('h:mmA')}
            </MetaText>
          </MetaContainer>
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
      </Container>
    );
  }
}
