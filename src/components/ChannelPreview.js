import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Moment from 'moment';
import { withLocalizationContext } from '../context';
import {
  LSK_CHANNEL_PREVIEW_NO_MESSAGE,
  LSK_CHANNEL_PREVIEW_MESSAGE_DELETED,
  LSK_CHANNEL_PREVIEW_ATTACHMENT,
  LSK_CHANNEL_PREVIEW_EMPTY_MESSAGE,
} from '../locale';

class ChannelPreview extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      unread: 0,
      lastMessage: {},
      lastRead: new Date(),
    };
  }

  static propTypes = {
    channel: PropTypes.object.isRequired,
    client: PropTypes.object.isRequired,
    setActiveChannel: PropTypes.func,
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  };

  static defaultProps = {
    // Preview: ChannelPreviewCountOnly,
  };

  componentDidMount() {
    // listen to change...
    const channel = this.props.channel;
    this.setState({ unread: channel.countUnread() });
    channel.on('message.new', this.handleNewMessageEvent);
    channel.on('message.read', this.handleReadEvent);
  }

  componentWillUnmount() {
    const channel = this.props.channel;
    channel.off('message.new', this.handleNewMessageEvent);
    channel.off('message.read', this.handleReadEvent);
  }

  handleReadEvent = (event) => {
    if (event.user.id === this.props.client.userID) {
      this.setState({ unread: this.props.channel.countUnread() });
    }
  };

  handleNewMessageEvent = (event) => {
    const channel = this.props.channel;
    this.setState({
      lastMessage: event.message,
      unread: channel.countUnread(),
    });
  };

  getLatestMessage = () => {
    const { channel, localizedStrings } = this.props;
    const message = channel.state.messages[channel.state.messages.length - 1];

    const latestMessage = {
      text: '',
      created_at: '',
      messageObject: { ...message },
    };

    if (!message) {
      latestMessage.text = localizedStrings[LSK_CHANNEL_PREVIEW_NO_MESSAGE];
      return latestMessage;
    }
    if (message.deleted_at) {
      latestMessage.text =
        localizedStrings[LSK_CHANNEL_PREVIEW_MESSAGE_DELETED];
      return latestMessage;
    }

    if (message.text) {
      latestMessage.text = message.text;
    } else {
      if (message.command) {
        latestMessage.text = '/' + message.command;
      } else if (message.attachments.length) {
        latestMessage.text = localizedStrings[LSK_CHANNEL_PREVIEW_ATTACHMENT];
      } else {
        latestMessage.text =
          localizedStrings[LSK_CHANNEL_PREVIEW_EMPTY_MESSAGE];
      }
    }

    if (Moment(message.created_at).isSame(new Date(), 'day'))
      latestMessage.created_at = Moment(message.created_at).format('HH:mm A');
    else {
      latestMessage.created_at = Moment(message.created_at).format('DD/MM/YY');
    }

    return latestMessage;
  };

  render() {
    const props = { ...this.state, ...this.props };
    const { Preview } = this.props;
    return <Preview {...props} latestMessage={this.getLatestMessage()} />;
  }
}

const ChannelPreviewWithContext = withLocalizationContext(ChannelPreview);
export { ChannelPreviewWithContext as ChannelPreview };
