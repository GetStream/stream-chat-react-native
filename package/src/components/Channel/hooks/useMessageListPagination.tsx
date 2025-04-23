import { useRef } from 'react';

import debounce from 'lodash/debounce';
import { Channel, ChannelState, MessageResponse } from 'stream-chat';

import { useChannelMessageDataState } from './useChannelDataState';

import { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import { useStableCallback } from '../../../hooks';
import { findInMessagesByDate, findInMessagesById } from '../../../utils/utils';

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
export const useMessageListPagination = ({ channel }: { channel: Channel }) => {
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
  } = useChannelMessageDataState(channel);

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreFinished = useRef(
    debounce(
      (hasMore: boolean, messages: ChannelState['messages']) => {
        loadMoreFinishedFn(hasMore, messages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreRecentFinished = useRef(
    debounce(
      (hasMore: boolean, newMessages: ChannelState['messages']) => {
        loadMoreRecentFinishedFn(hasMore, newMessages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  /**
   * This function loads the latest messages in the channel.
   */
  const loadLatestMessages = useStableCallback(async () => {
    try {
      setLoading(true);
      await channel.state.loadMessageIntoState('latest');
      loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
      jumpToLatestMessage();
    } catch (err) {
      console.warn('Loading latest messages failed with error:', err);
    }
  });

  /**
   * This function loads more messages before the first message in current channel state.
   */
  const loadMore = useStableCallback(async (limit: number = 20) => {
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
  });

  /**
   * This function loads more messages after the most recent message in current channel state.
   */
  const loadMoreRecent = useStableCallback(async (limit: number = 10) => {
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
  });

  /**
   * Loads channel around a specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   */
  const loadChannelAroundMessage: ChannelContextValue['loadChannelAroundMessage'] =
    useStableCallback(
      async ({ limit = 25, messageId: messageIdToLoadAround, setTargetedMessage }) => {
        if (!messageIdToLoadAround) {
          return;
        }
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
          setLoadingMore(false);
          setLoading(false);
          console.warn(
            'Message pagination(fetching messages in the channel around a message id) request failed with error:',
            error,
          );
          return;
        }
      },
    );

  /**
   * Fetch messages around a specific timestamp.
   */
  const fetchMessagesAround = useStableCallback(
    async (channel: Channel, timestamp: string, limit: number): Promise<MessageResponse[]> => {
      try {
        const { messages } = await channel.query(
          { messages: { created_at_around: timestamp, limit } },
          'new',
        );
        return messages;
      } catch (error) {
        console.error('Error fetching messages around timestamp:', error);
        throw error;
      }
    },
  );

  /**
   * Loads channel at first unread message.
   */
  const loadChannelAtFirstUnreadMessage: ChannelContextValue['loadChannelAtFirstUnreadMessage'] =
    useStableCallback(
      async ({ channelUnreadState, limit = 25, setChannelUnreadState, setTargetedMessage }) => {
        try {
          if (!channelUnreadState?.unread_messages) {
            return;
          }
          const { first_unread_message_id, last_read, last_read_message_id } = channelUnreadState;
          let firstUnreadMessageId = first_unread_message_id;
          let lastReadMessageId = last_read_message_id;
          let isInCurrentMessageSet = false;
          const messagesState = channel.state.messages;

          // If the first unread message is already in the current message set, we don't need to load more messages.
          if (firstUnreadMessageId) {
            const messageIdx = findInMessagesById(messagesState, firstUnreadMessageId);
            isInCurrentMessageSet = messageIdx !== -1;
          }
          // If the last read message is already in the current message set, we don't need to load more messages, and we set the first unread message id as that is what we want to operate on.
          else if (lastReadMessageId) {
            const messageIdx = findInMessagesById(messagesState, lastReadMessageId);
            isInCurrentMessageSet = messageIdx !== -1;
            firstUnreadMessageId = messageIdx > -1 ? messagesState[messageIdx + 1]?.id : undefined;
          } else {
            const lastReadTimestamp = last_read.getTime();
            const { index: lastReadIdx, message: lastReadMessage } = findInMessagesByDate(
              messagesState,
              last_read,
            );
            if (lastReadMessage) {
              lastReadMessageId = lastReadMessage.id;
              firstUnreadMessageId = messagesState[lastReadIdx + 1].id;
              isInCurrentMessageSet = !!firstUnreadMessageId;
            } else {
              setLoadingMore(true);
              setLoading(true);
              let messages;
              try {
                messages = await fetchMessagesAround(channel, last_read.toISOString(), limit);
              } catch (error) {
                setLoading(false);
                loadMoreFinished(channel.state.messagePagination.hasPrev, messagesState);
                console.log('Loading channel at first unread message failed with error:', error);
                return;
              }

              const firstMessageWithCreationDate = messages.find((msg) => msg.created_at);
              if (!firstMessageWithCreationDate) {
                loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                throw new Error('Failed to jump to first unread message id.');
              }
              const firstMessageTimestamp = new Date(
                firstMessageWithCreationDate.created_at as string,
              ).getTime();

              if (lastReadTimestamp < firstMessageTimestamp) {
                // whole channel is unread
                firstUnreadMessageId = firstMessageWithCreationDate.id;
              } else {
                const result = findInMessagesByDate(messages, last_read);
                lastReadMessageId = result.message?.id;
              }
              loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
            }
          }

          // If we still don't have the first and last read message id, we can't proceed.
          if (!firstUnreadMessageId && !lastReadMessageId) {
            throw new Error('Failed to jump to first unread message id.');
          }

          // If the first unread message is not in the current message set, we need to load message around the id.
          if (!isInCurrentMessageSet) {
            try {
              setLoadingMore(true);
              setLoading(true);
              const targetedMessage = (firstUnreadMessageId || lastReadMessageId) as string;
              await channel.state.loadMessageIntoState(targetedMessage, undefined, limit);
              /**
               * if the index of the last read message on the page is beyond the half of the page,
               * we have arrived to the oldest page of the channel
               */
              const indexOfTarget = channel.state.messages.findIndex(
                (message) => message.id === targetedMessage,
              );

              loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
              firstUnreadMessageId =
                firstUnreadMessageId ?? channel.state.messages[indexOfTarget + 1].id;
            } catch (error) {
              setLoading(false);
              loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
              console.log('Loading channel at first unread message failed with error:', error);
              return;
            }
          }

          if (!firstUnreadMessageId) {
            throw new Error('Failed to jump to first unread message id.');
          }
          if (!first_unread_message_id && setChannelUnreadState) {
            setChannelUnreadState({
              ...channelUnreadState,
              first_unread_message_id: firstUnreadMessageId,
              last_read_message_id: lastReadMessageId,
            });
          }

          jumpToMessageFinished(channel.state.messagePagination.hasNext, firstUnreadMessageId);
          if (setTargetedMessage) {
            setTargetedMessage(firstUnreadMessageId);
          }
        } catch (error) {
          console.log('Loading channel at first unread message failed with error:', error);
        }
      },
    );

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
