import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Moment from 'moment';
// import { ChannelPreviewCountOnly } from './ChannelPreviewCountOnly';

export class ChannelPreview extends PureComponent {
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
    activeChannel: PropTypes.object.isRequired,
    setActiveChannel: PropTypes.func.isRequired,
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  static defaultProps = {
    // Preview: ChannelPreviewCountOnly,
  };

  componentDidMount() {
    // listen to change...
    const channel = this.props.channel;
    channel.on('message.new', this.handleEvent);
  }

  componentWillUnmount() {
    const channel = this.props.channel;
    channel.off('message.new', this.handleEvent);
  }

  handleEvent = (event) => {
    const channel = this.props.channel;
    const isActive = this.props.activeChannel.cid === channel.cid;
    if (!isActive) {
      const unread = channel.countUnread(this.state.lastRead);
      this.setState({ lastMessage: event.message, unread });
    } else {
      this.setState({ lastMessage: event.message, unread: 0 });
    }
  };

  componentDidUpdate(prevProps) {
    if (this.props.activeChannel.cid !== prevProps.activeChannel.cid) {
      const isActive = this.props.activeChannel.cid === this.props.channel.cid;
      if (isActive) {
        this.setState({ unread: 0, lastRead: new Date() });
      }
    }
  }

  getLatestMessage = () => {
    const { channel } = this.props;

    const message = channel.state.messages[channel.state.messages.length - 1];

    const latestMessage = {
      text: '',
      created_at: '',
    };

    if (!message) {
      latestMessage.text = 'Nothing yet...';
      return latestMessage;
    }
    if (message.deleted_at) {
      latestMessage.text = 'Message deleted';
    }

    if (message.text) {
      latestMessage.text = message.text.slice(0, 20);
    } else {
      if (message.command) {
        latestMessage.text = '/' + message.command;
      }
      if (message.attachments.length) {
        latestMessage.text = '🏙 Attachment...';
      }
      latestMessage.text = 'Empty message...';
    }

    if (Moment(message.created_at).isSame(new Date(), 'day'))
      latestMessage.created_at = Moment(message.created_at).format('HH:MM A');
    else {
      latestMessage.created_at = Moment(message.created_at).format('DD/MM/YY');
    }

    return latestMessage;
  };

  render() {
    const props = { ...this.state, ...this.props };

    const { Preview } = this.props;

    return (
      <Preview
        {...props}
        latestMessage={this.getLatestMessage()}
        active={this.props.activeChannel.cid === this.props.channel.cid}
      />
    );
  }
}
