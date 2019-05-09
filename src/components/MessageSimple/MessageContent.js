import React from 'react';
import { Dimensions, View, Text, TouchableOpacity } from 'react-native';
import moment from 'moment';
import { buildStylesheet } from '../../styles/styles.js';
import { Attachment } from '../Attachment';
import { ReactionList } from '../ReactionList';
import { ReactionPicker } from '../ReactionPicker';
import { ActionSheetCustom as ActionSheet } from '../../vendor/react-native-actionsheet/lib';
import { MessageText } from './MessageText';
import { MessageReplies } from './MessageReplies';
import { MESSAGE_ACTIONS } from '../../utils';
import Immutable from 'seamless-immutable';

export class MessageContent extends React.PureComponent {
  constructor(props) {
    super(props);

    this.ActionSheet = false;
    this.state = { reactionPickerVisible: false };
  }

  openThread = () => {
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
        rpTop: y - 60,
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

    const styles = buildStylesheet('MessageSimpleContent', {});

    const showTime =
      message.groupPosition[0] === 'single' ||
      message.groupPosition[0] === 'bottom'
        ? true
        : false;

    const options = [{ id: 'cancel', title: 'Cancel' }];

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
        <View style={{ ...styles.container, ...styles[pos], padding: 5 }}>
          <Text style={{ ...styles.deletedText, ...styles.text }}>
            This message was deleted ...
          </Text>
        </View>
      );

    const contentProps = {
      style: {
        ...styles.container,
        ...styles[pos],
        ...(styles[message.status] ? styles[message.status] : {}),
      },
      onLongPress: options.length > 1 ? this.showActionSheet : null,
      activeOpacity: 0.7,
      disabled: readOnly,
    };

    if (message.status === 'failed')
      contentProps.onPress = retrySendMessage.bind(this, Immutable(message));

    return (
      <TouchableOpacity {...contentProps}>
        {message.status === 'failed' ? (
          <Text>Message failed - try again</Text>
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
        <View
          ref={(o) => (this.messageContainer = o)}
          collapsable={false}
          style={{ alignItems: 'flex-end' }}
        >
          {hasAttachment
            ? message.attachments.map((attachment, index) => (
                <Attachment
                  key={`${message.id}-${index}`}
                  attachment={attachment}
                />
              ))
            : false}
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
        </View>
        <MessageReplies
          message={message}
          isThreadList={!!threadList}
          openThread={this.openThread}
          pos={pos}
        />

        {showTime ? (
          <View style={styles.metaContainer}>
            <Text style={{ ...styles.metaText, textAlign: pos }}>
              {moment(message.created_at).format('h:mmA')}
            </Text>
          </View>
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
          handleDismiss={() => {
            this.setState({ reactionPickerVisible: false });
          }}
          rpLeft={this.state.rpLeft}
          rpRight={this.state.rpRight}
          rpTop={this.state.rpTop}
        />
      </TouchableOpacity>
    );
  }
}
