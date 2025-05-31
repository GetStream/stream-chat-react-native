import React, { useCallback, useEffect } from 'react';

import { ThreadFooterComponent } from './components/ThreadFooterComponent';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import {
  MessageInput as DefaultMessageInput,
  MessageInputProps,
} from '../MessageInput/MessageInput';
import type { MessageListProps } from '../MessageList/MessageList';

type ThreadPropsWithContext = Pick<ChatContextValue, 'client'> &
  Pick<MessagesContextValue, 'MessageList'> &
  Pick<
    ThreadContextValue,
    | 'closeThread'
    | 'loadMoreThread'
    | 'parentMessagePreventPress'
    | 'reloadThread'
    | 'thread'
    | 'threadInstance'
  > & {
    /**
     * Additional props for underlying MessageInput component.
     * Available props - https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-input/#props
     * */
    additionalMessageInputProps?: Partial<MessageInputProps>;
    /**
     * Additional props for underlying MessageList component.
     * Available props - https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-list/#props
     * */
    additionalMessageListProps?: Partial<MessageListProps>;
    /** Make input focus on mounting thread */
    autoFocus?: boolean;
    /** Closes thread on dismount, defaults to true */
    closeThreadOnDismount?: boolean;
    /** Disables the thread UI. So MessageInput and MessageList will be disabled. */
    disabled?: boolean;
    /**
     * **Customized MessageInput component to used within Thread instead of default MessageInput
     * **Available from [MessageInput](https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-input)**
     */
    MessageInput?: React.ComponentType<MessageInputProps>;
    /**
     * Call custom function on closing thread if handling thread state elsewhere
     */
    onThreadDismount?: () => void;
  };

const ThreadWithContext = (props: ThreadPropsWithContext) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    autoFocus = true,
    closeThread,
    closeThreadOnDismount = true,
    disabled,
    loadMoreThread,
    MessageInput = DefaultMessageInput,
    MessageList,
    onThreadDismount,
    parentMessagePreventPress = true,
    thread,
    threadInstance,
  } = props;

  useEffect(() => {
    if (threadInstance?.activate) {
      threadInstance.activate();
    }
    const loadMoreThreadAsync = async () => {
      await loadMoreThread();
    };

    if (thread?.id && thread.reply_count) {
      loadMoreThreadAsync();
    }

    return () => {
      if (threadInstance?.deactivate) {
        threadInstance.deactivate();
      }
      if (closeThreadOnDismount) {
        closeThread();
      }
      if (onThreadDismount) {
        onThreadDismount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const MemoizedThreadFooterComponent = useCallback(
    () => <ThreadFooterComponent parentMessagePreventPress={parentMessagePreventPress} />,
    [parentMessagePreventPress],
  );

  if (!thread) {
    return null;
  }

  return (
    <React.Fragment key={`thread-${thread.id}`}>
      <MessageList
        FooterComponent={MemoizedThreadFooterComponent}
        threadList
        {...additionalMessageListProps}
      />
      <MessageInput
        additionalTextInputProps={{
          autoFocus,
          editable: !disabled,
        }}
        threadList
        {...additionalMessageInputProps}
      />
    </React.Fragment>
  );
};

export type ThreadProps = Partial<ThreadPropsWithContext>;

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 *
 * Thread is a consumer of [channel context](https://getstream.io/chat/docs/sdk/reactnative/contexts/channel-context/)
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalMessageListProps
 * - additionalMessageInputProps
 */
export const Thread = (props: ThreadProps) => {
  const { client } = useChatContext();
  const { threadList } = useChannelContext();
  const { MessageList } = useMessagesContext();
  const { closeThread, loadMoreThread, reloadThread, thread, threadInstance } = useThreadContext();

  if (thread?.id && !threadList) {
    throw new Error(
      'Please add a threadList prop to your Channel component when rendering a thread list. Check our Channel documentation for more info: https://getstream.io/chat/docs/sdk/reactnative/core-components/channel/#threadlist',
    );
  }

  return (
    <ThreadWithContext
      {...{
        client,
        closeThread,
        loadMoreThread,
        MessageList,
        reloadThread,
        thread,
        threadInstance,
      }}
      {...props}
    />
  );
};
