import React, { PureComponent } from 'react';
import { withChatContext } from '../context';
import { Text } from 'react-native';

// import { LoadingIndicator } from './LoadingIndicator';

import PropTypes from 'prop-types';

// import { MessageSimple } from './MessageSimple';
// import { Attachment } from './Attachment';
import { ChannelInner } from './ChannelInner';

/**
 * Channel - Wrapper component for a channel. It needs to be place inside of the Chat component.
 * ChannelHeader, MessageList, Thread and MessageInput should be used as children of the Channel component.
 *
 * @example ./docs/Channel.md
 * @extends PureComponent
 */
const Channel = withChatContext(
  class Channel extends PureComponent {
    constructor(props) {
      super(props);
      this.state = { error: false };
    }
    static propTypes = {
      /** Which channel to connect to, will initialize the channel if it's not initialized yet */
      channel: PropTypes.shape({
        watch: PropTypes.func,
      }).isRequired,
      /** Client is passed automatically via the Chat Context */
      client: PropTypes.object.isRequired,
      /** The loading indicator to use */
      // LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    };

    static defaultProps = {
      // LoadingIndicator,
      // Message: MessageSimple,
      // Attachment,
    };

    render() {
      if (!this.props.channel.cid) {
        return <Text>Please select a channel first</Text>;
      }

      return <ChannelInner {...this.props} />;
    }
  },
);

export { Channel };
