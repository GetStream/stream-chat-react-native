import React, { useCallback, useEffect, useMemo } from 'react';

import type { LocalMessage } from 'stream-chat';

import {
  ThreadFooterComponent,
  ThreadFooterComponentProps,
} from './components/ThreadFooterComponent';

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
  Pick<ThreadContextValue, 'threadInstance'> &
  Pick<ThreadFooterComponentProps, 'parentMessagePreventPress'> & {
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
  // `hasItems`, not the array: every use below is an `items === undefined` test ("has the reply
  // paginator loaded yet"), so selecting the array re-renders this component on every reply.
  hasItems: state.items !== undefined,
  isLoading: state.isLoading,
  lastQueryError: state.lastQueryError,
});

const threadStaleSelector = (state: { isLoading: boolean; isStateStale: boolean }) => ({
  isStateStale: state.isStateStale,
  isThreadReloading: state.isLoading,
});

const ThreadWithContext = (props: ThreadPropsWithContext) => {
  const {
    additionalMessageComposerProps,
    additionalMessageListProps,
    additionalMessageFlashListProps,
    autoFocus = false,
    disabled,
    onThreadDismount,
    notificationHostId: notificationHostIdProp,
    parentMessagePreventPress = true,
    threadInstance,
    shouldUseFlashList = false,
  } = props;
  const {
    LoadingErrorIndicator,
    MessageList,
    ThreadMessageComposer: MessageComposer,
  } = useComponentsContext();

  const { hasItems, isLoading, lastQueryError } =
    useStateStore(threadInstance?.messagePaginator?.state, paginatorSelector) ?? {};
  const { isStateStale, isThreadReloading } =
    useStateStore(threadInstance?.state, threadStaleSelector) ?? {};
  const threadId = threadInstance?.id;

  useEffect(() => {
    if (threadInstance && isStateStale) {
      void threadInstance.reload().catch((err) => console.warn('Thread reload failed', err));
    }
  }, [isStateStale, threadInstance]);

  // Activating registers the thread with `client.threads` for the session, which keeps it subscribed
  // (incoming replies, read state, thread.updated) whether or not the thread list holds it. Keyed on
  // the instance, which can arrive after mount; the cleanup deactivates the previous one.
  useEffect(() => {
    if (!threadInstance) return;
    threadInstance.activate?.();
    return () => threadInstance.deactivate?.();
  }, [threadInstance]);

  // Load the first reply page, but only when the paginator hasn't already been seeded from the
  // thread's `latest_replies` (managed/queried threads seed on construction) or loaded/loading. A
  // seeded paginator already holds its first page, so we skip the fetch and let scroll-up load older
  // replies — mirroring stream-chat-react, whose thread list has no mount-time fetch. Reactive on
  // `threadInstance`/`hasItems` because the instance can arrive after mount; the `hasItems`
  // guard makes this fire at most once (an unseeded thread fetches, and the fetch defines `items`).
  useEffect(() => {
    if (!threadInstance || isLoading || hasItems || lastQueryError) {
      return;
    }
    // A reload in flight (a stale thread's, started by the effect above in this same commit) seeds the
    // replies itself; read live, as this commit's render predates it. If it fails, this runs again.
    if (isThreadReloading || threadInstance.state.getLatestValue().isLoading) {
      return;
    }
    void threadInstance.messagePaginator.toTail();
    // `lastQueryError` is load-bearing here, not decorative: a failed query flips `isLoading` back to
    // false with `hasItems` still false, which would re-run this effect and refetch forever. The
    // retry is the user's to make, through the error indicator below.
  }, [threadInstance, hasItems, isLoading, lastQueryError, isThreadReloading]);

  // Deactivation is the activation effect's cleanup; this only notifies the integrator.
  useEffect(
    () => () => {
      if (onThreadDismount) {
        onThreadDismount();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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

  if (!threadId) {
    return null;
  }

  const notificationHostId = notificationHostIdProp ?? getThreadNotificationHostId(threadId);

  // The thread's own query error, rendered here rather than by `<Channel>`: the failure belongs to
  // the reply paginator, and only this component knows how to retry it (a first-page `toTail`).
  if (lastQueryError && !hasItems) {
    const retry = () =>
      threadInstance.messagePaginator
        .toTail()
        .catch((err: unknown) => console.warn('Reloading the thread replies failed:', err));

    return <LoadingErrorIndicator error={lastQueryError} listType='message' retry={retry} />;
  }

  return (
    <React.Fragment key={`thread-${threadId}`}>
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
  const { threadInstance } = useThreadContext();

  if (threadInstance?.id && !threadList) {
    throw new Error(
      'Please add a threadList prop to your Channel component when rendering a thread list. Check our Channel documentation for more info: https://getstream.io/chat/docs/sdk/reactnative/core-components/channel/#threadlist',
    );
  }

  return (
    <ThreadWithContext
      {...{
        client,
        threadInstance,
      }}
      {...props}
    />
  );
};
