import React, { useCallback, useEffect, useMemo } from 'react';

import { ThreadFooterComponent } from './components/ThreadFooterComponent';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import {
  MessageComposer as DefaultMessageComposer,
  MessageComposerProps,
} from '../MessageInput/MessageComposer';
import { MessageFlashList, MessageFlashListProps } from '../MessageList/MessageFlashList';
import { MessageListProps } from '../MessageList/MessageList';

let FlashList;

try {
  FlashList = require('@shopify/flash-list').FlashList;
} catch {
  FlashList = undefined;
}

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
     * Additional props for underlying MessageComposer component.
     * Available props - https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-input/#props
     * */
    additionalMessageComposerProps?: Partial<MessageComposerProps>;
    /**
     * Additional props for underlying MessageList component.
     * Available props - https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-list/#props
     * */
    additionalMessageListProps?: Partial<MessageListProps>;
    /**
     * @experimental This prop is experimental and is subject to change.
     *
     * Additional props for underlying MessageListFlashList component.
     * Available props - https://shopify.github.io/flash-list/docs/usage
     */
    additionalMessageFlashListProps?: Partial<MessageFlashListProps>;
    /** Make input focus on mounting thread */
    autoFocus?: boolean;
    /** Closes thread on dismount, defaults to true */
    closeThreadOnDismount?: boolean;
    /** Disables the thread UI. So MessageComposer and MessageList will be disabled. */
    disabled?: boolean;
    /**
     * **Customized MessageComposer component to used within Thread instead of default MessageComposer
     * **Available from [MessageComposer](https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-input)**
     */
    MessageComposer?: React.ComponentType<MessageComposerProps>;
    /**
     * Call custom function on closing thread if handling thread state elsewhere
     */
    onThreadDismount?: () => void;
    shouldUseFlashList?: boolean;
  };

const ThreadWithContext = (props: ThreadPropsWithContext) => {
  const {
    additionalMessageComposerProps,
    additionalMessageListProps,
    additionalMessageFlashListProps,
    autoFocus = false,
    closeThread,
    closeThreadOnDismount = true,
    disabled,
    loadMoreThread,
    MessageComposer = DefaultMessageComposer,
    MessageList,
    onThreadDismount,
    parentMessagePreventPress = true,
    thread,
    threadInstance,
    shouldUseFlashList = false,
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

  const additionalTextInputProps = useMemo(
    () => ({
      editable: !disabled,
      autoFocus,
    }),
    [disabled, autoFocus],
  );

  if (!thread?.id) {
    return null;
  }

  return (
    <React.Fragment key={`thread-${thread.id}`}>
      {FlashList && shouldUseFlashList ? (
        <MessageFlashList
          HeaderComponent={MemoizedThreadFooterComponent}
          threadList
          {...additionalMessageFlashListProps}
        />
      ) : (
        <MessageList
          FooterComponent={MemoizedThreadFooterComponent}
          threadList
          {...additionalMessageListProps}
        />
      )}
      <MessageComposer
        additionalTextInputProps={additionalTextInputProps}
        threadList
        {...additionalMessageComposerProps}
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
 * Underlying MessageList, MessageComposer and Message components can be customized using props:
 * - additionalMessageListProps
 * - additionalMessageComposerProps
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
