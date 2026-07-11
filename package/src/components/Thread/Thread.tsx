import React, { useCallback, useEffect, useMemo } from 'react';

import type { LocalMessage, Thread as StreamThread } from 'stream-chat';

import { ThreadFooterComponent } from './components/ThreadFooterComponent';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import { useStateStore } from '../../hooks/useStateStore';

import type { MessageComposerProps } from '../MessageInput/MessageComposer';
import { MessageFlashList, MessageFlashListProps } from '../MessageList/MessageFlashList';
import { MessageListProps } from '../MessageList/MessageList';
import { getThreadNotificationHostId } from '../Notifications/notificationTarget';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

let FlashList;

try {
  FlashList = require('@shopify/flash-list').FlashList;
} catch {
  FlashList = undefined;
}

type ThreadPropsWithContext = Pick<ChatContextValue, 'client'> &
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
     * Call custom function on closing thread if handling thread state elsewhere
     */
    onThreadDismount?: () => void;
    notificationHostId?: string;
    shouldUseFlashList?: boolean;
  };

type ThreadReplyPaginatorState = {
  isLoading: boolean;
  items?: LocalMessage[];
  lastQueryError?: Error;
};

const paginatorSelector = (state: ThreadReplyPaginatorState) => ({
  isLoading: state.isLoading,
  items: state.items,
  lastQueryError: state.lastQueryError,
});

const threadStaleSelector = (state: { isStateStale: boolean }) => ({
  isStateStale: state.isStateStale,
});

const threadManagerSelector = (state: { threads: StreamThread[] }) => ({
  threads: state.threads,
});

const ThreadWithContext = (props: ThreadPropsWithContext) => {
  const {
    client,
    additionalMessageComposerProps,
    additionalMessageListProps,
    additionalMessageFlashListProps,
    autoFocus = false,
    closeThread,
    closeThreadOnDismount = true,
    disabled,
    loadMoreThread,
    onThreadDismount,
    notificationHostId: notificationHostIdProp,
    parentMessagePreventPress = true,
    thread,
    threadInstance,
    shouldUseFlashList = false,
  } = props;
  const { MessageList, ThreadMessageComposer: MessageComposer } = useComponentsContext();

  const { isLoading, items, lastQueryError } =
    useStateStore(threadInstance?.messagePaginator?.state, paginatorSelector) ?? {};
  const { isStateStale } = useStateStore(threadInstance?.state, threadStaleSelector) ?? {};
  const { threads } = useStateStore(client.threads.state, threadManagerSelector) ?? {
    threads: client.threads.state.getLatestValue().threads,
  };
  const isThreadManaged = threadInstance?.id
    ? threads.some((managedThread) => managedThread.id === threadInstance.id)
    : false;

  // Mirror stream-chat-react: an unmanaged thread whose reply paginator hasn't loaded yet gets a
  // metadata reload (parent message, read state, participants) — not a paginator reload.
  useEffect(() => {
    if (!threadInstance || isThreadManaged) return;
    if (items !== undefined || isLoading) return;
    void threadInstance.reload().catch((err) => console.warn('Thread reload failed', err));
  }, [isThreadManaged, threadInstance, isLoading, items]);

  // Reload when the thread's state goes stale (e.g. user stopped then resumed watching the channel).
  useEffect(() => {
    if (threadInstance && isStateStale) {
      void threadInstance.reload().catch((err) => console.warn('Thread reload failed', err));
    }
  }, [isStateStale, threadInstance]);

  // Once the reply paginator has loaded, adopt the instance into the ThreadManager. The manager
  // registers the thread's subscriptions on adoption, which keeps the reply list live (incoming
  // replies, read state, thread.updated) — mirrors stream-chat-react.
  useEffect(() => {
    if (!threadInstance || isThreadManaged) return;
    if (isLoading || lastQueryError || items === undefined) return;
    client.threads.state.next((current) =>
      current.threads.some((managedThread) => managedThread.id === threadInstance.id)
        ? current
        : { ...current, threads: [threadInstance, ...current.threads] },
    );
  }, [client.threads.state, isThreadManaged, threadInstance, isLoading, items, lastQueryError]);

  useEffect(() => {
    if (threadInstance?.activate) {
      threadInstance.activate();
    }
    const loadMoreThreadAsync = async () => {
      await loadMoreThread();
    };

    // Load the reply paginator's first page even for a reply-less thread (returns []), so `items`
    // becomes defined and the adopt effect can register the thread with the manager. Mirrors
    // stream-chat-react, whose MessageList always loads the thread paginator.
    if (thread?.id) {
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

  const notificationHostId = notificationHostIdProp ?? getThreadNotificationHostId(thread.id);

  return (
    <React.Fragment key={`thread-${thread.id}`}>
      <NotificationTargetProvider hostId={notificationHostId} panel='thread'>
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
      </NotificationTargetProvider>
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
        reloadThread,
        thread,
        threadInstance,
      }}
      {...props}
    />
  );
};
