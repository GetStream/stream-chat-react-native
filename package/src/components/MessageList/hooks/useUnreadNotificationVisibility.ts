import { useState } from 'react';

import type { Channel, LocalMessage } from 'stream-chat';

import { useStableCallback } from '../../../hooks';
import type { AttachmentPickerStore } from '../../../state-store/attachment-picker-store';
import type { MarkReadFunctionOptions } from '../../Channel/Channel';

type UseUnreadNotificationVisibilityParams = {
  attachmentPickerStore: AttachmentPickerStore;
  channel: Channel;
  markRead: (options?: MarkReadFunctionOptions) => Promise<void> | void;
  readEvents: boolean | undefined;
  userId: string | undefined;
};

/**
 * Whether the "N new messages" notification is shown at the top of a channel list: the user has
 * scrolled up past the last message they read, and that message is no longer on screen.
 */
export const useUnreadNotificationVisibility = ({
  attachmentPickerStore,
  channel,
  markRead,
  readEvents,
  userId,
}: UseUnreadNotificationVisibilityParams) => {
  const [isUnreadNotificationOpen, setIsUnreadNotificationOpen] = useState(false);

  const updateUnreadNotification = useStableCallback(
    ({
      isAtOldestMessage,
      topVisibleMessage,
      viewableMessages,
    }: {
      isAtOldestMessage: boolean;
      topVisibleMessage: LocalMessage | undefined;
      viewableMessages: LocalMessage[];
    }) => {
      const { firstUnreadMessageId, lastReadAt, lastReadMessageId, unreadCount } =
        channel.messagePaginator.unreadStateSnapshot.getLatestValue();
      // Only the last read message going off screen opens it, not ordinary scrolling past old ones.
      const lastReadMessageVisible = viewableMessages.some(
        (message) => message.id === lastReadMessageId,
      );
      // Channels without read events (livestreams) still show it when they count unread locally.
      const unreadNotificationSupported =
        readEvents || channel.config.readEvents.localUnreadCountEnabled;

      if (
        !topVisibleMessage ||
        !unreadNotificationSupported ||
        lastReadMessageVisible ||
        attachmentPickerStore.state.getLatestValue().selectedPicker === 'images' ||
        isAtOldestMessage
      ) {
        setIsUnreadNotificationOpen(false);
        return;
      }

      // A single long own message is marked read before it has a `created_at`, which would
      // otherwise open the notification right after sending it.
      if (
        viewableMessages.length === 1 &&
        channel.countUnread() === 0 &&
        topVisibleMessage.user?.id === userId
      ) {
        setIsUnreadNotificationOpen(false);
        return;
      }

      // With no read state at all there is no boundary to compare against.
      const hasUnreadState = firstUnreadMessageId || lastReadMessageId || unreadCount;
      setIsUnreadNotificationOpen(
        Boolean(hasUnreadState) && topVisibleMessage.created_at > (lastReadAt ?? 0),
      );
    },
  );

  const onUnreadNotificationClose = useStableCallback(async () => {
    await markRead();
    setIsUnreadNotificationOpen(false);
  });

  return { isUnreadNotificationOpen, onUnreadNotificationClose, updateUnreadNotification };
};
