import { useRef } from 'react';

import debounce from 'lodash/debounce';
import { Channel, ChannelState } from 'stream-chat';

import { useChannelMessageDataState } from './useChannelDataState';

import { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import { DefaultStreamChatGenerics } from '../../../types/types';

const defaultDebounceInterval = 500;
const debounceOptions = {
  leading: true,
  trailing: true,
};

/**
 * The useMessageListPagination hook handles pagination for the message list.
 * It provides functionality to load more messages, load more recent messages, load latest messages, and load channel around a specific message.
 *
 * @param channel The channel object for which the message list pagination is being handled.
 */
export const useMessageListPagination = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
}: {
  channel: Channel<StreamChatGenerics>;
}) => {
  const {
    copyMessagesStateFromChannel,
    jumpToLatestMessage,
    jumpToMessageFinished,
    loadInitialMessagesStateFromChannel,
    loadMoreFinished: loadMoreFinishedFn,
    loadMoreRecentFinished: loadMoreRecentFinishedFn,
    setLoading,
    setLoadingMore,
    setLoadingMoreRecent,
    state,
  } = useChannelMessageDataState<StreamChatGenerics>(channel);

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreFinished = useRef(
    debounce(
      (hasMore: boolean, messages: ChannelState<StreamChatGenerics>['messages']) => {
        loadMoreFinishedFn(hasMore, messages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreRecentFinished = useRef(
    debounce(
      (hasMore: boolean, newMessages: ChannelState<StreamChatGenerics>['messages']) => {
        loadMoreRecentFinishedFn(hasMore, newMessages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  /**
   * This function loads the latest messages in the channel.
   */
  const loadLatestMessages = async () => {
    try {
      setLoading(true);
      await channel.state.loadMessageIntoState('latest');
      loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
      jumpToLatestMessage();
    } catch (err) {
      console.warn('Loading latest messages failed with error:', err);
    }
  };

  /**
   * This function loads more messages before the first message in current channel state.
   */
  const loadMore = async (limit = 20) => {
    if (!channel.state.messagePagination.hasPrev) {
      return;
    }

    if (state.loadingMore || state.loadingMoreRecent) {
      return;
    }

    setLoadingMore(true);
    const oldestMessage = state.messages?.[0];
    const oldestID = oldestMessage?.id;

    try {
      await channel.query({
        messages: { id_lt: oldestID, limit },
        watchers: { limit },
      });
      loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
      setLoadingMore(false);
    } catch (e) {
      setLoadingMore(false);
      console.warn('Message pagination(fetching old messages) request failed with error:', e);
    }
  };

  /**
   * This function loads more messages after the most recent message in current channel state.
   */
  const loadMoreRecent = async (limit = 10) => {
    if (!channel.state.messagePagination.hasNext) {
      return;
    }

    if (state.loadingMore || state.loadingMoreRecent) {
      return;
    }

    setLoadingMoreRecent(true);
    const newestMessage = state.messages?.[state?.messages.length - 1];
    const newestID = newestMessage?.id;

    try {
      await channel.query({
        messages: { id_gt: newestID, limit },
        watchers: { limit },
      });
      loadMoreRecentFinished(channel.state.messagePagination.hasNext, channel.state.messages);
    } catch (e) {
      setLoadingMoreRecent(false);
      console.warn('Message pagination(fetching new messages) request failed with error:', e);
      return;
    }
  };

  /**
   * Loads channel around a specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   */
  const loadChannelAroundMessage: ChannelContextValue<StreamChatGenerics>['loadChannelAroundMessage'] =
    async ({ limit = 25, messageId: messageIdToLoadAround, setTargetedMessage }) => {
      if (!messageIdToLoadAround) return;
      setLoadingMore(true);
      setLoading(true);
      try {
        await channel.state.loadMessageIntoState(messageIdToLoadAround, undefined, limit);
        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
        jumpToMessageFinished(channel.state.messagePagination.hasNext, messageIdToLoadAround);

        if (setTargetedMessage) {
          setTargetedMessage(messageIdToLoadAround);
        }
      } catch (error) {
        console.warn(
          'Message pagination(fetching messages in the channel around a message id) request failed with error:',
          error,
        );
        return;
      }
    };

  /**
   * Loads channel at first unread message.
   */
  const loadChannelAtFirstUnreadMessage = async ({
    limit = 25,
    setTargetedMessage,
  }: {
    limit?: number;
    setTargetedMessage?: (messageId: string) => void;
  }) => {
    let unreadMessageIdToScrollTo: string | undefined;
    const unreadCount = channel.countUnread();
    if (unreadCount === 0) return;
    const isLatestMessageSetShown = !!channel.state.messageSets.find(
      (set) => set.isCurrent && set.isLatest,
    );

    if (isLatestMessageSetShown && unreadCount <= channel.state.messages.length) {
      unreadMessageIdToScrollTo =
        channel.state.messages[channel.state.messages.length - unreadCount].id;
      if (unreadMessageIdToScrollTo) {
        setLoadingMore(true);
        await channel.state.loadMessageIntoState(unreadMessageIdToScrollTo, undefined, limit);
        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
        jumpToMessageFinished(channel.state.messagePagination.hasNext, unreadMessageIdToScrollTo);
        if (setTargetedMessage) {
          setTargetedMessage(unreadMessageIdToScrollTo);
        }
      }
      return;
    }
    const lastReadDate = channel.lastRead();
    let messages;
    if (lastReadDate) {
      try {
        messages = (
          await channel.query(
            {
              messages: {
                created_at_around: lastReadDate,
                limit: 30,
              },
              watch: true,
            },
            'new',
          )
        ).messages;

        unreadMessageIdToScrollTo = messages.find(
          (m) => lastReadDate < (m.created_at ? new Date(m.created_at) : new Date()),
        )?.id;
        if (unreadMessageIdToScrollTo) {
          setLoadingMore(true);
          await channel.state.loadMessageIntoState(unreadMessageIdToScrollTo, undefined, limit);
          loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
          jumpToMessageFinished(channel.state.messagePagination.hasNext, unreadMessageIdToScrollTo);
          if (setTargetedMessage) {
            setTargetedMessage(unreadMessageIdToScrollTo);
          }
        }
      } catch (error) {
        console.warn(
          'Message pagination(fetching messages in the channel around unread message) request failed with error:',
          error,
        );
        return;
      }
    } else {
      await loadLatestMessages();
    }
  };

  return {
    copyMessagesStateFromChannel,
    loadChannelAroundMessage,
    loadChannelAtFirstUnreadMessage,
    loadInitialMessagesStateFromChannel,
    loadLatestMessages,
    loadMore,
    loadMoreRecent,
    state,
  };
};
