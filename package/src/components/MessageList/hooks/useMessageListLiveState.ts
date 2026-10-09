import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { Channel, EventPayload, LocalMessage, MessagePaginator } from 'stream-chat';

import { useStableCallback } from '../../../hooks';
import type { MarkReadFunctionOptions } from '../../Channel/Channel';

const hasReadLastMessage = (channel: Channel, userId: string) => {
  const latestMessageIdInChannel = channel.messagePaginator.state
    .getLatestValue()
    .items?.at(-1)?.id;
  const lastReadMessageIdServer = channel.state.read[userId]?.last_read_message_id;
  return latestMessageIdInChannel === lastReadMessageIdServer;
};

type UseMessageListLiveStateParams = {
  channel: Channel;
  markRead: (options?: MarkReadFunctionOptions) => void;
  /** The list's paginator: the channel's, or the open thread's in a thread list. */
  paginator: MessagePaginator | undefined;
  threadList: boolean;
  userId: string | undefined;
};

/**
 * Tells `paginator` whether the user is viewing its latest messages: the app is in the foreground,
 * the newest messages are loaded, and the newest one is on screen. While that holds, `stream-chat`
 * does not count an incoming message as unread (`messagePaginator.isViewingLive`).
 *
 * A channel list also marks the channel read when a message arrives in that state. A thread list
 * leaves the channel's flags alone: the channel list underneath it keeps reporting its own.
 *
 * Returns the callback the list calls with the messages currently on screen.
 */
export const useMessageListLiveState = ({
  channel,
  markRead,
  paginator,
  threadList,
  userId,
}: UseMessageListLiveStateParams) => {
  const [isAppActive, setIsAppActive] = useState(() => AppState.currentState === 'active');
  const isNewestMessageVisibleRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) =>
      setIsAppActive(nextAppState === 'active'),
    );
    return () => subscription.remove();
  }, []);

  // Viewability reports on scroll; this reports when the app goes to or comes from the background.
  // Reset on unmount, so a list that is gone never keeps unread counting switched off.
  useEffect(() => {
    if (!paginator) {
      return;
    }
    paginator.setViewingLive(isAppActive && isNewestMessageVisibleRef.current);
    return () => paginator.setViewingLive(false);
  }, [isAppActive, paginator]);

  useEffect(() => {
    if (threadList) {
      return;
    }

    const handleEvent = (event: EventPayload<'message.new'>) => {
      const mainChannelUpdated = !event.message?.parent_id || event.message?.show_in_channel;
      if (!mainChannelUpdated || !userId) {
        return;
      }
      const { firstUnreadMessageId } =
        channel.messagePaginator.unreadStateSnapshot.getLatestValue();
      if (
        channel.messagePaginator.isViewingLive &&
        !firstUnreadMessageId &&
        !hasReadLastMessage(channel, userId)
      ) {
        markRead();
      }
    };

    const listener = channel.on('message.new', handleEvent);
    return () => listener.unsubscribe();
  }, [channel, markRead, threadList, userId]);

  return useStableCallback((viewableMessages: LocalMessage[]) => {
    if (!paginator) {
      return;
    }
    // The last loaded message is the newest one only when nothing newer is left to load.
    const { hasMoreHead, items } = paginator.state.getLatestValue();
    const newestMessageId = hasMoreHead ? undefined : items?.at(-1)?.id;
    isNewestMessageVisibleRef.current =
      newestMessageId !== undefined &&
      viewableMessages.some((message) => message.id === newestMessageId);
    paginator.setViewingLive(isAppActive && isNewestMessageVisibleRef.current);
  });
};
