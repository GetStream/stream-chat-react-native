import React, { PropsWithChildren, useEffect } from 'react';

import type { LocalMessage, Thread as ThreadInstance } from 'stream-chat';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import type { ThreadContextValue } from '../../contexts/threadContext/ThreadContext';
import { useStableCallback } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { ChannelConfigProps, ChannelShell } from '../Channel/ChannelShell';
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
    /**
     * Called when the thread unmounts, e.g. to clear the app's record of the open thread.
     */
    onThreadDismount?: () => void;
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

/**
 * Thread - binds its children to a thread's replies. Render it next to `<Channel>`, not inside it,
 * and compose the thread UI as children:
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
    children,
    notificationHostId: notificationHostIdProp,
    onThreadDismount,
    thread,
    ...shellProps
  } = props;
  const { LoadingErrorIndicator } = useComponentsContext();

  const { hasItems, isLoading, lastQueryError } =
    useStateStore(thread.messagePaginator.state, paginatorSelector) ?? {};
  const { isStateStale, isThreadReloading } =
    useStateStore(thread.state, threadStaleSelector) ?? {};

  useEffect(() => {
    if (isStateStale) {
      void thread.reload().catch((err) => console.warn('Thread reload failed', err));
    }
  }, [isStateStale, thread]);

  // A thread opened from the thread list can belong to a channel nothing has queried yet. `queryThreads`
  // watches that channel but returns no `own_capabilities` for it, so the menu, the reactions and the
  // composer would act as if the user could do nothing. Querying the channel once fills them in; its
  // messages and read state are left alone.
  useEffect(() => {
    const { channel } = thread;
    if (channel.initialized || channel.isProvisional) {
      return;
    }
    channel.watch().catch((err: unknown) => console.warn('Thread channel watch failed', err));
  }, [thread]);

  // Activating registers the thread with `client.threads` for the session, which keeps it subscribed
  // (incoming replies, read state, thread.updated) whether or not the thread list holds it. While
  // active, the thread marks itself read. `activate()` returns the release of this activation.
  useEffect(() => thread.activate(), [thread]);

  // Load the first reply page, but only when the paginator hasn't already been seeded from the
  // thread's `latest_replies` (managed/queried threads seed on construction) or loaded/loading. A
  // seeded paginator already holds its first page, so we skip the fetch and let scroll-up load older
  // replies — mirroring stream-chat-react, whose thread list has no mount-time fetch. The `hasItems`
  // guard makes this fire at most once (an unseeded thread fetches, and the fetch defines `items`).
  useEffect(() => {
    if (isLoading || hasItems || lastQueryError) {
      return;
    }
    // A reload in flight (a stale thread's, started by the effect above in this same commit) seeds the
    // replies itself; read live, as this commit's render predates it. If it fails, this runs again.
    if (isThreadReloading || thread.state.getLatestValue().isLoading) {
      return;
    }
    void thread.messagePaginator.toTail();
    // `lastQueryError` is load-bearing here, not decorative: a failed query flips `isLoading` back to
    // false with `hasItems` still false, which would re-run this effect and refetch forever. The
    // retry is the user's to make, through the error indicator below.
  }, [thread, hasItems, isLoading, lastQueryError, isThreadReloading]);

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

  // A jump into the replies (e.g. to a targeted reply) leaves a focus signal behind; the list reads
  // this to keep its initial anchor from overriding the jump.
  const hasPendingInitialTargetLoad = useStableCallback(
    () => !!thread.messagePaginator.messageFocusSignal.getLatestValue().signal,
  );

  // The thread's own query error: the failure belongs to the reply paginator, and the retry is a
  // first-page `toTail`.
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
      <ChannelShell
        {...shellProps}
        channel={thread.channel}
        hasPendingInitialTargetLoad={hasPendingInitialTargetLoad}
        thread={thread}
      >
        {children}
      </ChannelShell>
    </NotificationTargetProvider>
  );
};
