import { useEffect } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks';
import { useMarkRead } from '../../MessageList/hooks/useMarkRead';
import { DEFAULT_HIGHLIGHT_DURATION } from '../../MessageList/hooks/useMessageListFocus';
import { useNotificationApi } from '../../Notifications';

const DEFAULT_MESSAGE_LIST_PAGE_SIZE = 25;

export type UseChannelLifecycleParams = Pick<TranslationContextValue, 't'> & {
  channel: Channel;
  client: StreamChat;
  initialScrollToFirstUnreadMessage: boolean;
  initializeOnMount: boolean;
  markReadOnMount: boolean;
};

/**
 * A hook encapsulating everything `<Channel>` does to a channel while it is mounted. The first load
 * (watch, a cold open's first page, the unread snapshot, the jump to the first unread, mark read on
 * open etc.), activation and mark read after a reconnect.
 *
 * Returns whether the list is already aimed at a message, which the list reads to keep its initial
 * anchor from overriding that jump.
 */
export const useChannelLifecycle = ({
  channel,
  client,
  initialScrollToFirstUnreadMessage,
  initializeOnMount,
  markReadOnMount,
  t,
}: UseChannelLifecycleParams) => {
  const { addNotification } = useNotificationApi();

  const notifyJumpToFirstUnreadError = useStableCallback((error: unknown) => {
    addNotification({
      message: t(
        'channel.jumpToFirstUnreadFailed.error',
        'Failed to jump to the first unread message',
      ),
      options: {
        ...(error instanceof Error ? { originalError: error } : {}),
        severity: 'error',
        type: 'channel:jumpToFirstUnread:failed',
      },
      origin: { context: { feature: 'jumpToFirstUnread' }, emitter: 'Channel' },
    });
  });

  /**
   * Whether something already jumped the list to a message, i.e an integrator calling
   * `channel.messagePaginator.jumpToMessage()` before or while the channel mounts. A jump leaves a
   * focus signal on the paginator, and while it is set the channel does not jump to the first unread.
   *
   * Read on demand rather than subscribed to, since only effects ask.
   */
  const hasFocusTarget = useStableCallback(
    () => !!channel.messagePaginator.messageFocusSignal.getLatestValue().signal,
  );

  const shouldLoadInitialChannelAtFirstUnreadMessage = useStableCallback((unreadCount?: number) => {
    if (hasFocusTarget() || !initialScrollToFirstUnreadMessage || !client.user) {
      return false;
    }

    return (unreadCount ?? channel.countUnread()) > 0;
  });

  const hasPendingInitialTargetLoad = useStableCallback(() => {
    return hasFocusTarget() || shouldLoadInitialChannelAtFirstUnreadMessage();
  });

  // markRead is not placed on the ChannelContext; the message lists own their own throttled
  // instance via useMarkRead(channel). The lifecycle needs its own for mark-read on open and after a
  // reconnect.
  const markRead = useMarkRead(channel);

  useEffect(() => {
    const initChannel = async () => {
      const unreadCount = channel.countUnread();
      const shouldLoadAtFirstUnread = shouldLoadInitialChannelAtFirstUnreadMessage(unreadCount);
      if (!channel) {
        return;
      }

      // a draft has no id and is marked initialized and querying it would create it on the server
      if (channel.isProvisional && channel.initialized) {
        return;
      }

      channel.messagePaginator.pageSize = DEFAULT_MESSAGE_LIST_PAGE_SIZE;

      if (
        (!channel.initialized || !channel.messagePaginator.isActiveIntervalAtHead) &&
        initializeOnMount
      ) {
        try {
          await channel?.watch();
        } catch (err) {
          console.warn('Channel watch request failed with error:', err);
          channel.offlineMode = true;
        }
      }

      // we seed the paginator on cold open (push/deep link for example)
      if (!channel.messagePaginator.state.getLatestValue().items?.length) {
        await channel.messagePaginator.reload();
      }

      // A reopened channel keeps its paginator and with it the unread snapshot from the first open.
      // Seed it again from the current read state so the unread separator, the unread banner and
      // the jump to the first unread match what is unread now.
      channel.messagePaginator.seedUnreadSnapshot();

      if (shouldLoadAtFirstUnread) {
        try {
          await channel.messagePaginator.jumpToTheFirstUnreadMessage({
            focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
          });
        } catch (error) {
          notifyJumpToFirstUnreadError(error);
        }
      }

      if (unreadCount > 0 && markReadOnMount) {
        // needed to keep the unread banner stable
        await markRead({ updateChannelUnreadState: false });
      }
    };

    initChannel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => channel?.activate(), [channel]);

  useEffect(() => {
    // Mark read has to wait for `connection.recovered`, as it is dispatched once the reloads have
    // landed, so `hasMoreHead` read here reflects the refreshed window. Channel view only, and only
    // when that window is at the newest, only if the user has paginated up into older history so leave
    // their read state alone.
    const { unsubscribe } = client.on('connection.recovered', () => {
      if (channel.messagePaginator.hasMoreHead) {
        return;
      }
      markRead();
    });

    return unsubscribe;
  }, [channel, client, markRead]);

  return { hasPendingInitialTargetLoad };
};
