import { useState } from 'react';

import { Channel, LocalMessage } from 'stream-chat';

import { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback, useStateStore } from '../../../hooks';
import { useNotificationApi } from '../../Notifications';

export const DEFAULT_HIGHLIGHT_DURATION = 3000;

type MessagePaginatorState = {
  hasMoreHead: boolean;
  hasMoreTail: boolean;
  isLoading: boolean;
  items?: LocalMessage[];
};

// Direction mapping (stream-chat MessagePaginator):
//   tailward === id_lt === OLDER messages  -> loadMore / hasMore
//   headward === id_gt === NEWER messages  -> loadMoreRecent / hasMoreNewer
const selector = (state: MessagePaginatorState) => ({
  hasMore: state.hasMoreTail,
  hasMoreNewer: state.hasMoreHead,
  isLoading: state.isLoading,
  messages: state.items,
});

/**
 * The useMessageListPagination hook exposes the channel's message list + pagination, sourced
 * from `channel.messagePaginator` (stream-chat). Pagination, jump-to-message, jump-to-latest and
 * jump-to-first-unread are delegated to the paginator; the directional loading flags are kept as
 * local UI state around the paginator calls.
 *
 * @param channel The channel whose message list is paginated.
 */
export const useMessageListPagination = ({ channel }: { channel: Channel }) => {
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const paginator = channel.messagePaginator;

  const { hasMore, hasMoreNewer, isLoading, messages } =
    useStateStore(paginator.state, selector) ?? {};

  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);

  /**
   * Loads the latest (newest) messages in the channel.
   */
  const loadLatestMessages = useStableCallback(async () => {
    try {
      await paginator.jumpToTheLatestMessage();
    } catch (err) {
      console.warn('Loading latest messages failed with error:', err);
    }
  });

  /**
   * Loads older messages (before the oldest loaded message).
   */
  const loadMore = useStableCallback(async () => {
    if (!paginator.hasMoreTail || paginator.isLoading) {
      return;
    }
    setLoadingMore(true);
    try {
      await paginator.toTail();
    } catch (e) {
      console.warn('Message pagination(fetching old messages) request failed with error:', e);
    } finally {
      setLoadingMore(false);
    }
  });

  /**
   * Loads newer messages (after the most recent loaded message).
   */
  const loadMoreRecent = useStableCallback(async () => {
    if (!paginator.hasMoreHead || paginator.isLoading) {
      return;
    }
    setLoadingMoreRecent(true);
    try {
      await paginator.toHead();
    } catch (e) {
      console.warn('Message pagination(fetching new messages) request failed with error:', e);
    } finally {
      setLoadingMoreRecent(false);
    }
  });

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
   * Loads the channel around a specific message and targets it for highlight.
   *
   * @param messageId If undefined, no-op.
   */
  const loadChannelAroundMessage: ChannelContextValue['loadChannelAroundMessage'] =
    useStableCallback(async ({ messageId: messageIdToLoadAround }) => {
      if (!messageIdToLoadAround) {
        return;
      }
      try {
        // jumpToMessage loads-around the target AND emits messageFocusSignal, which drives both the
        // highlight and the scroll-to-target — no separate targeted-message React state needed.
        await paginator.jumpToMessage(messageIdToLoadAround, {
          focusReason: 'jump-to-message',
          focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
        });
      } catch (error) {
        console.warn(
          'Message pagination(fetching messages around a message id) request failed with error:',
          error,
        );
      }
    });

  /**
   * Loads the channel at the first unread message. The paginator resolves the first-unread id
   * from its unread snapshot / channel read state.
   */
  const loadChannelAtFirstUnreadMessage: ChannelContextValue['loadChannelAtFirstUnreadMessage'] =
    useStableCallback(async () => {
      try {
        // jumpToTheFirstUnreadMessage emits messageFocusSignal, which drives the highlight + scroll.
        await paginator.jumpToTheFirstUnreadMessage({
          focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
        });
      } catch (error) {
        notifyJumpToFirstUnreadError(error);
      }
    });

  return {
    loadChannelAroundMessage,
    loadChannelAtFirstUnreadMessage,
    loadLatestMessages,
    loadMore,
    loadMoreRecent,
    state: {
      hasMore,
      hasMoreNewer,
      loading: !!isLoading && !messages?.length,
      loadingMore,
      loadingMoreRecent,
      messages,
    },
  };
};
