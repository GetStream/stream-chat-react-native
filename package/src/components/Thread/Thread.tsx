import React, { useEffect } from 'react';

import { ThreadFooterComponent } from './components/ThreadFooterComponent';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import {
  MessageInput as DefaultMessageInput,
  MessageInputProps,
} from '../MessageInput/MessageInput';
import type { MessageListProps } from '../MessageList/MessageList';

type ThreadPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'MessageList'> &
  Pick<
    ThreadContextValue<StreamChatGenerics>,
    'closeThread' | 'loadMoreThread' | 'reloadThread' | 'thread'
  > & {
    /**
     * Additional props for underlying MessageInput component.
     * Available props - https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-input/#props
     * */
    additionalMessageInputProps?: Partial<MessageInputProps<StreamChatGenerics>>;
    /**
     * Additional props for underlying MessageList component.
     * Available props - https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-list/#props
     * */
    additionalMessageListProps?: Partial<MessageListProps<StreamChatGenerics>>;
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
    MessageInput?: React.ComponentType<MessageInputProps<StreamChatGenerics>>;
    /**
     * Call custom function on closing thread if handling thread state elsewhere
     */
    onThreadDismount?: () => void;
  };

const ThreadWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ThreadPropsWithContext<StreamChatGenerics>,
) => {
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
    thread,
  } = props;

  useEffect(() => {
    const loadMoreThreadAsync = async () => {
      await loadMoreThread();
    };

    if (thread?.id && thread.reply_count) {
      loadMoreThreadAsync();
    }
  }, []);

  useEffect(
    () => () => {
      if (closeThreadOnDismount) {
        closeThread();
      }
      if (onThreadDismount) {
        onThreadDismount();
      }
    },
    [],
  );

  if (!thread) return null;

  return (
    <React.Fragment key={`thread-${thread.id}`}>
      <MessageList
        FooterComponent={ThreadFooterComponent}
        threadList
        {...additionalMessageListProps}
      />
      <MessageInput<StreamChatGenerics>
        additionalTextInputProps={{ autoFocus, editable: !disabled }}
        threadList
        {...additionalMessageInputProps}
      />
    </React.Fragment>
  );
};

export type ThreadProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<ThreadPropsWithContext<StreamChatGenerics>>;

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 *
 * Thread is a consumer of [channel context](https://getstream.io/chat/docs/sdk/reactnative/contexts/channel-context/)
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalMessageListProps
 * - additionalMessageInputProps
 */
export const Thread = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ThreadProps<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { threadList } = useChannelContext<StreamChatGenerics>();
  const { MessageList } = useMessagesContext<StreamChatGenerics>();
  const { closeThread, loadMoreThread, reloadThread, thread } =
    useThreadContext<StreamChatGenerics>();

  if (thread?.id && !threadList) {
    throw new Error(
      'Please add a threadList prop to your Channel component when rendering a thread list. Check our Channel documentation for more info: https://getstream.io/chat/docs/sdk/reactnative/core-components/channel/#threadlist',
    );
  }

  return (
    <ThreadWithContext<StreamChatGenerics>
      {...{
        client,
        closeThread,
        loadMoreThread,
        MessageList,
        reloadThread,
        thread,
      }}
      {...props}
    />
  );
};
