import { useEffect } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks';
import { useMarkRead } from '../../MessageList/hooks/useMarkRead';
import { DEFAULT_HIGHLIGHT_DURATION } from '../../MessageList/hooks/useMessageListFocus';
import { useNotificationApi } from '../../Notifications';

const DEFAULT_MESSAGE_LIST_PAGE_SIZE = 25;

/**
 * Whether a message page size is registered through `client.config`, under
 * `channel.messagePaginator` or `messagePaginator`. The default page size is applied only when none
 * is, as the `pageSize` setter outranks every registered config.
 */
const hasRegisteredMessagePageSize = (client: StreamChat) =>
  client.config.getConfig('channel')?.messagePaginator?.pageSize !== undefined ||
  client.config.getConfig('messagePaginator')?.pageSize !== undefined;

export type UseChannelLifecycleParams = Pick<TranslationContextValue, 't'> & {
  channel: Channel;
  client: StreamChat;
  initialScrollToFirstUnreadMessage: boolean;
  initializeOnMount: boolean;
  markReadOnMount: boolean;
};

/**
 * Everything `<Channel>` does to its channel while mounted: the first load (watch, first page,
 * unread snapshot, jump to the first unread, mark read), activation, and mark read after a
 * reconnect.
 *
 * @param params.channel The channel to manage.
 * @param params.client The chat client.
 * @param params.initialScrollToFirstUnreadMessage Jumps to the first unread message on open.
 * @param params.initializeOnMount Calls `channel.watch()` on mount when the channel needs it.
 * @param params.markReadOnMount Marks the channel as read on mount.
 * @param params.t The translation function.
 * @returns `hasPendingInitialTargetLoad`, which tells the list whether a jump to a message is
 * pending so its initial anchor does not override it.
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

  // Whether something already jumped the list to a message, such as `jumpToMessage()` called
  // before or while mounting. That leaves a focus signal on the paginator, which suppresses the
  // jump to the first unread. Read on demand since only effects ask.
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

  // The message lists own their own throttled `markRead`, so the lifecycle needs its own.
  const markRead = useMarkRead(channel);

  useEffect(() => {
    const initChannel = async () => {
      const unreadCount = channel.countUnread();
      const shouldLoadAtFirstUnread = shouldLoadInitialChannelAtFirstUnreadMessage(unreadCount);
      if (!channel) {
        return;
      }

      // A draft has no ID and is marked initialized, and querying it would create it on the server.
      if (channel.isProvisional && channel.initialized) {
        return;
      }

      // Keep the message-list page light; a page size registered through `client.config` wins.
      if (!hasRegisteredMessagePageSize(client)) {
        channel.messagePaginator.pageSize = DEFAULT_MESSAGE_LIST_PAGE_SIZE;
      }

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

      // Cold open (push or deep link): seed the paginator.
      if (!channel.messagePaginator.state.getLatestValue().items?.length) {
        await channel.messagePaginator.reload();
      }

      // A reopened channel keeps its paginator and its first-open unread snapshot, so reseed it
      // from the current read state.
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
        // Keeps the unread banner stable.
        await markRead({ updateChannelUnreadState: false });
      }
    };

    initChannel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => channel?.activate(), [channel]);

  useEffect(() => {
    // Waits for `connection.recovered`, which fires after the reloads land, so `hasMoreHead`
    // reflects the refreshed window. Marks read only when that window is at the newest message,
    // leaving the read state alone when the user has paginated up into older history.
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
