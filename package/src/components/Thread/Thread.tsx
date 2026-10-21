import React, { PropsWithChildren, useEffect } from 'react';

import type { LocalMessage, Thread as ThreadInstance } from 'stream-chat';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { ThreadContextValue, ThreadProvider } from '../../contexts/threadContext/ThreadContext';
import { useStableCallback } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { ChannelConfigProps, ChannelShell } from '../Channel/ChannelShell';
import { useCreateThreadContext } from '../Channel/hooks/useCreateThreadContext';
import { getThreadNotificationHostId } from '../Notifications/notificationTarget';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export type ThreadProps = ChannelConfigProps &
  Partial<Pick<ThreadContextValue, 'allowThreadMessagesInChannel'>> & {
    /**
     * The thread to render. Pass the instance a thread was opened with (`onThreadSelect` on the
     * message and thread lists), or one from `client.threads.ensure({ channel, parentMessage })`.
     */
    thread: ThreadInstance;
    /**
     * The notification host this thread's notifications are routed to. Defaults to the thread's
     * own host, derived from its id.
     */
    notificationHostId?: string;
    /** Called when the thread unmounts, e.g. to clear the app's record of the open thread. */
    onThreadDismount?: () => void;
  };

type ThreadReplyPaginatorState = {
  isLoading: boolean;
  items?: LocalMessage[];
  lastQueryError?: Error;
};

const paginatorSelector = (state: ThreadReplyPaginatorState) => ({
  // `hasItems` rather than the array: the array would re-render this component on every reply.
  hasItems: state.items !== undefined,
  isLoading: state.isLoading,
  lastQueryError: state.lastQueryError,
});

const threadStaleSelector = (state: { isLoading: boolean; isStateStale: boolean }) => ({
  isStateStale: state.isStateStale,
  isThreadReloading: state.isLoading,
});

/**
 * Binds its children to a thread's replies. Render it next to `<Channel>`, not inside it, and
 * compose the thread UI as children:
 *
 * ```tsx
 * <Thread thread={thread}>
 *   <MessageList />
 *   <MessageComposer />
 * </Thread>
 * ```
 *
 * It takes the same configuration props as `<Channel>`. The message list renders the parent message
 * above the replies.
 */
export const Thread = (props: PropsWithChildren<ThreadProps>) => {
  const {
    allowThreadMessagesInChannel = true,
    children,
    notificationHostId: notificationHostIdProp,
    onThreadDismount,
    thread,
    ...shellProps
  } = props;
  const { LoadingErrorIndicator } = useComponentsContext();
  const threadContext = useCreateThreadContext({ allowThreadMessagesInChannel, thread });

  const { hasItems, isLoading, lastQueryError } =
    useStateStore(thread.messagePaginator.state, paginatorSelector) ?? {};
  const { isStateStale, isThreadReloading } =
    useStateStore(thread.state, threadStaleSelector) ?? {};

  useEffect(() => {
    if (isStateStale) {
      void thread.reload().catch((err) => console.warn('Thread reload failed', err));
    }
  }, [isStateStale, thread]);

  // A thread opened from the thread list can belong to a channel nobody has queried. `queryThreads`
  // returns no `own_capabilities` for it, so the menu, reactions and composer would treat the user
  // as having none; watching the channel once fills them in.
  useEffect(() => {
    const { channel } = thread;
    if (channel.initialized || channel.isProvisional) {
      return;
    }
    channel.watch().catch((err: unknown) => console.warn('Thread channel watch failed', err));
  }, [thread]);

  // Activating keeps the thread subscribed (new replies, read state, `thread.updated`) even when
  // the thread list does not hold it, and marks it read while active. `activate()` returns the
  // release.
  useEffect(() => thread.activate(), [thread]);

  // Load the first reply page unless the paginator is loading or already holds items (threads seed
  // from `latest_replies` on construction). `hasItems` makes this fire at most once.
  useEffect(() => {
    if (isLoading || hasItems || lastQueryError) {
      return;
    }
    // A reload in flight (started by the stale-state effect above in this commit) seeds the replies
    // itself. Read live, because this render predates it. If it fails, this runs again.
    if (isThreadReloading || thread.state.getLatestValue().isLoading) {
      return;
    }
    void thread.messagePaginator.toTail();
    // `lastQueryError` must stay a dependency: a failed query sets `isLoading` back to false with
    // `hasItems` still false, which would otherwise refetch forever. The error indicator retries.
  }, [thread, hasItems, isLoading, lastQueryError, isThreadReloading]);

  // Deactivation is the activation effect's cleanup; this only calls the callback.
  useEffect(
    () => () => {
      if (onThreadDismount) {
        onThreadDismount();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // A jump to a targeted reply leaves a focus signal that stops the list's initial anchor from
  // overriding the jump.
  const hasPendingInitialTargetLoad = useStableCallback(
    () => !!thread.messagePaginator.messageFocusSignal.getLatestValue().signal,
  );

  // The error belongs to the reply paginator; retrying reloads the first page with `toTail`.
  if (lastQueryError && !hasItems) {
    const retry = () =>
      thread.messagePaginator
        .toTail()
        .catch((err: unknown) => console.warn('Reloading the thread replies failed:', err));

    return <LoadingErrorIndicator error={lastQueryError} listType='message' retry={retry} />;
  }

  return (
    <NotificationTargetProvider
      hostId={notificationHostIdProp ?? getThreadNotificationHostId(thread.id)}
      key={`thread-${thread.id}`}
      panel='thread'
    >
      <ThreadProvider value={threadContext}>
        <ChannelShell
          {...shellProps}
          channel={thread.channel}
          hasPendingInitialTargetLoad={hasPendingInitialTargetLoad}
          thread={thread}
        >
          {children}
        </ChannelShell>
      </ThreadProvider>
    </NotificationTargetProvider>
  );
};
