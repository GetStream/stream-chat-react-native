import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Moment from 'moment';
import { withTranslationContext } from '../context';

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
    const { channel, t } = this.props;
    const message = channel.state.messages[channel.state.messages.length - 1];

    const latestMessage = {
      text: '',
      created_at: '',
      messageObject: { ...message },
    };

    if (!message) {
      latestMessage.text = t('Nothing yet...');
      return latestMessage;
    }
    if (message.deleted_at) {
      latestMessage.text = t('Message deleted');
      return latestMessage;
    }

    if (message.text) {
      latestMessage.text = message.text;
    } else {
      if (message.command) {
        latestMessage.text = '/' + message.command;
      } else if (message.attachments.length) {
        latestMessage.text = t('🏙 Attachment...');
      } else {
        latestMessage.text = t('Empty message...');
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

const ChannelPreviewWithContext = withTranslationContext(ChannelPreview);

export { ChannelPreviewWithContext as ChannelPreview };
