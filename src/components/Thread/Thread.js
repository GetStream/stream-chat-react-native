import React, { useContext, useEffect } from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

import DefaultMessage from '../Message/Message';
import DefaultMessageInput from '../MessageInput/MessageInput';
import DefaultMessageList from '../MessageList/MessageList';

import { ChannelContext, ChatContext, MessagesContext } from '../../context';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { themed } from '../../styles/theme';

const NewThread = styled.View`
  padding: 8px;
  background-color: #f4f9ff;
  margin: 10px;
  border-radius: 4;
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
 * @example ../docs/Thread.md
 */
const Thread = (props) => {
  const translationContext = useTranslationContext();
  const { t } = translationContext;
  const channelContext = useContext(ChannelContext);
  const { channel } = channelContext;
  const { Message: MessageFromContext } = useContext(MessagesContext);
  const {
    loadMoreThread,
    thread,
    threadHasMore = true,
    threadLoadingMore,
    threadMessages,
  } = useThreadContext();
  const chatContext = useContext(ChatContext);
  const {
    autoFocus = true,
    Message: MessageFromProps,
    MessageList = DefaultMessageList,
    MessageInput = DefaultMessageInput,
    additionalParentMessageProps,
    disabled,
    additionalMessageListProps,
    additionalMessageInputProps,
  } = props;

  const Message = MessageFromProps || MessageFromContext;

  /**
   * TODO: This should be removed when possible along with the spread into Message
   */
  const legacyProps = {
    ...props,
    ...translationContext,
    ...chatContext,
    ...channelContext,
    autoFocus,
    MessageInput,
    MessageList,
    threadHasMore,
  };

  useEffect(() => {
    const loadMoreThreadAsync = async () => {
      await loadMoreThread();
    };

    if (thread && thread.id && thread.reply_count) {
      loadMoreThreadAsync();
    }
  }, []);

  if (!thread) {
    return null;
  }

  const read = {};
  const headerComponent = (
    <>
      <DefaultMessage
        groupStyles={['single']}
        initialMessage
        message={thread}
        Message={Message}
        readOnly
        threadList
        // TODO: remove the following line in next release, since we already have additionalParentMessageProps now.
        {...legacyProps}
        {...additionalParentMessageProps}
      />
      <NewThread>
        <NewThreadText>{t('Start of a new thread')}</NewThreadText>
      </NewThread>
    </>
  );

  // this ensures that if you switch thread the component is recreated
  const key = `thread-${thread.id}-${channel.cid}`;

  return (
    <React.Fragment key={key}>
      <MessageList
        hasMore={threadHasMore}
        HeaderComponent={headerComponent}
        loadingMore={threadLoadingMore}
        loadMore={loadMoreThread}
        Message={Message}
        messages={threadMessages}
        read={read}
        threadList
        {...additionalMessageListProps}
      />
      <MessageInput
        disabled={disabled}
        focus={autoFocus}
        parent={thread}
        {...additionalMessageInputProps}
      />
    </React.Fragment>
  );
};

Thread.themePath = 'thread';

Thread.propTypes = {
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react-native/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,
  /**
   * Additional props for underlying MessageList component.
   * Available props - https://getstream.github.io/stream-chat-react-native/#messagelist
   * */
  additionalMessageListProps: PropTypes.object,
  /**
   * Additional props for underlying Message component of parent message at the top.
   * Available props - https://getstream.github.io/stream-chat-react-native/#message
   * */
  additionalParentMessageProps: PropTypes.object,
  /** Make input focus on mounting thread */
  autoFocus: PropTypes.bool,
  /**
   * **Customized MessageInput component to used within Thread instead of default MessageInput
   * **Available from [MessageInput](https://getstream.github.io/stream-chat-react-native/#messageinput)**
   * */
  /** Disables the thread UI. So MessageInput and MessageList will be disabled. */
  disabled: PropTypes.bool,
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   * */
  Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  MessageInput: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * **Customized MessageList component to used within Thread instead of default MessageList
   * **Available from [MessageList](https://getstream.github.io/stream-chat-react-native/#messagelist)**
   * */
  MessageList: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default themed(Thread);
