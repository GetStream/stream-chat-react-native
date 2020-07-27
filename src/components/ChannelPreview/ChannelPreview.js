import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { withTranslationContext } from '../../context';

class ChannelPreview extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      unread: 0,
      lastMessage: {},
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
      this.setState({ unread: 0 });
    }
  };

  handleNewMessageEvent = (event) => {
    const channel = this.props.channel;
    this.setState({
      lastMessage: event.message,
      unread: channel.countUnread(),
    });
  };

  getLatestMessageDisplayText = (message) => {
    const { t } = this.props;

    if (!message) {
      return t('Nothing yet...');
    }

    if (message.deleted_at) {
      return t('Message deleted');
    }

    if (message.text) {
      return message.text;
    }

    if (message.command) {
      return '/' + message.command;
    }

    if (message.attachments.length) {
      return t('🏙 Attachment...');
    }

    return t('Empty message...');
  };

  getLatestMessageDisplayDate = (message) => {
    const { tDateTimeParser } = this.props;

    if (tDateTimeParser(message.created_at).isSame(new Date(), 'day'))
      return tDateTimeParser(message.created_at).format('LT');
    else {
      return tDateTimeParser(message.created_at).format('L');
    }
  };

  getLatestMessage = () => {
    const { channel } = this.props;
    const message = channel.state.messages[channel.state.messages.length - 1];

    return {
      text: this.getLatestMessageDisplayText(message),
      created_at: this.getLatestMessageDisplayDate(message),
    };
  };

  render() {
    const { Preview } = this.props;
    return (
      <Preview
        {...this.props}
        lastMessage={this.state.lastMessage}
        unread={this.state.unread}
        latestMessage={this.getLatestMessage()}
      />
    );
  }
}

export default withTranslationContext(ChannelPreview);
