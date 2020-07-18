import React from 'react';

import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

import { withChannelContext, withTranslationContext } from '../../context';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { Message } from '../Message';

import { themed } from '../../styles/theme';

const NewThread = styled.View`
  padding: 8px;
  background-color: #f4f9ff;
  margin: 10px;
  border-radius: 4;
  display: flex;
  align-items: center;
  ${({ theme }) => theme.thread.newThread.css};
`;

const NewThreadText = styled.Text`
  ${({ theme }) => theme.thread.newThread.text.css};
`;

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 *
 * Thread is a consumer of [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalParentMessageProps
 * - additionalMessageListProps
 * - additionalMessageInputProps
 *
 * @example ./docs/Thread.md
 * @extends Component
 */
class Thread extends React.PureComponent {
  static themePath = 'thread';
  static propTypes = {
    /** Make input focus on mounting thread */
    autoFocus: PropTypes.bool,
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)**
     * */
    channel: PropTypes.object.isRequired,
    /**
     *  **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)**
     * */
    Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * **Customized MessageInput component to used within Thread instead of default MessageInput
     * **Available from [MessageInput](https://getstream.github.io/stream-chat-react-native/#messageinput)**
     * */
    MessageInput: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * **Customized MessageList component to used within Thread instead of default MessageList
     * **Available from [MessageList](https://getstream.github.io/stream-chat-react-native/#messagelist)**
     * */
    MessageList: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)**
     * The thread (the parent [message object](https://getstream.io/chat/docs/#message_format)) */
    thread: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)**
     * The array of immutable messages to render. By default they are provided by parent Channel component */
    threadMessages: PropTypes.array.isRequired,
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)**
     *
     * Function which provides next page of thread messages.
     * loadMoreThread is called when infinite scroll wants to load more messages
     * */
    loadMoreThread: PropTypes.func.isRequired,
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)**
     * If there are more messages available, set to false when the end of pagination is reached.
     * */
    threadHasMore: PropTypes.bool,
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)**
     * If the thread is currently loading more messages. This is helpful to display a loading indicator on threadlist */
    threadLoadingMore: PropTypes.bool,
    /** Disables the thread UI. So MessageInput and MessageList will be disabled. */
    disabled: PropTypes.bool,
    /**
     * Additional props for underlying Message component of parent message at the top.
     * Available props - https://getstream.github.io/stream-chat-react-native/#message
     * */
    additionalParentMessageProps: PropTypes.object,
    /**
     * Additional props for underlying MessageList component.
     * Available props - https://getstream.github.io/stream-chat-react-native/#messagelist
     * */
    additionalMessageListProps: PropTypes.object,
    /**
     * Additional props for underlying MessageInput component.
     * Available props - https://getstream.github.io/stream-chat-react-native/#messageinput
     * */
    additionalMessageInputProps: PropTypes.object,
  };

  static defaultProps = {
    threadHasMore: true,
    threadLoadingMore: true,
    autoFocus: true,
    MessageList,
    MessageInput,
  };

  render() {
    if (!this.props.thread) {
      return null;
    }

    const parentID = this.props.thread.id;
    const cid = this.props.channel.cid;

    const key = `thread-${parentID}-${cid}`;
    // We use a wrapper to make sure the key variable is set.
    // this ensures that if you switch thread the component is recreated
    return <ThreadInner {...this.props} key={key} />;
  }
}

class ThreadInner extends React.PureComponent {
  static propTypes = {
    /** Channel is passed via the Channel Context */
    channel: PropTypes.object.isRequired,
    /** the thread (just a message) that we're rendering */
    thread: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messageList = React.createRef();
  }

  async componentDidMount() {
    const parentID = this.props.thread.id;
    if (parentID && this.props.thread.reply_count) {
      await this.props.loadMoreThread();
    }
  }

  render() {
    const {
      t,
      thread,
      additionalParentMessageProps,
      threadMessages,
      loadMoreThread,
      threadHasMore,
      threadLoadingMore,
      additionalMessageListProps,
      autoFocus,
      additionalMessageInputProps,
      MessageList: MessageListComponent,
      MessageInput: MessageInputComponent,
      disabled,
    } = this.props;
    if (!thread) {
      return null;
    }

    const read = {};
    const headerComponent = (
      <React.Fragment>
        <Message
          message={thread}
          initialMessage
          threadList
          readOnly
          groupStyles={['single']}
          Message={this.props.Message}
          // TODO: remove the following line in next release, since we already have additionalParentMessageProps now.
          {...this.props}
          {...additionalParentMessageProps}
        />
        <NewThread>
          <NewThreadText>{t('Start of a new thread')}</NewThreadText>
        </NewThread>
      </React.Fragment>
    );

    return (
      <React.Fragment>
        <MessageListComponent
          messages={threadMessages}
          HeaderComponent={headerComponent}
          read={read}
          threadList
          loadMore={loadMoreThread}
          hasMore={threadHasMore}
          loadingMore={threadLoadingMore}
          Message={this.props.Message}
          {...additionalMessageListProps}
        />
        <MessageInputComponent
          parent={thread}
          focus={autoFocus}
          disabled={disabled}
          {...additionalMessageInputProps}
        />
      </React.Fragment>
    );
  }
}

export default withTranslationContext(withChannelContext(themed(Thread)));
