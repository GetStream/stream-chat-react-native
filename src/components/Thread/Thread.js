import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

import { ChannelContext, ChatContext, TranslationContext } from '../../context';
import { Message as DefaultMessage } from '../Message';
import { MessageInput as DefaultMessageInput } from '../MessageInput';
import { MessageList as DefaultMessageList } from '../MessageList';
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
 * @example ../docs/Thread.md
 */
const Thread = (props) => {
  const translationContext = useContext(TranslationContext);
  const { t } = translationContext;
  const channelContext = useContext(ChannelContext);
  const {
    channel,
    Message,
    thread,
    threadMessages,
    loadMoreThread,
    threadHasMore = true,
    threadLoadingMore,
  } = channelContext;
  const chatContext = useContext(ChatContext);
  const {
    autoFocus = true,
    MessageList = DefaultMessageList,
    MessageInput = DefaultMessageInput,
    additionalParentMessageProps,
    disabled,
    additionalMessageListProps,
    additionalMessageInputProps,
  } = props;

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

    if (thread?.id && thread?.reply_count) {
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
  MessageInput: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * **Customized MessageList component to used within Thread instead of default MessageList
   * **Available from [MessageList](https://getstream.github.io/stream-chat-react-native/#messagelist)**
   * */
  MessageList: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default themed(Thread);
