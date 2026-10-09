import { useRef, useState } from 'react';

import type { LocalMessage } from 'stream-chat';
import { convertTimestampToDate } from 'stream-chat';

import { useStableCallback } from '../../../hooks';

/**
 * The date the list's sticky header shows: the day of the topmost message on screen. Hidden once the
 * oldest message of the whole list is on screen, where the inline date separator says the same.
 */
export const useStickyHeaderDate = () => {
  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date | undefined>();
  const stickyHeaderDateRef = useRef<Date | undefined>(undefined);

  const updateStickyHeaderDate = useStableCallback(
    ({
      isAtOldestMessage,
      topVisibleMessage,
    }: {
      isAtOldestMessage: boolean;
      topVisibleMessage: LocalMessage;
    }) => {
      if (isAtOldestMessage) {
        setStickyHeaderDate(undefined);
        return;
      }
      if (topVisibleMessage.type === 'deleted' || topVisibleMessage.created_at == null) {
        return;
      }
      const date = convertTimestampToDate(topVisibleMessage.created_at);
      if (date?.toDateString() !== stickyHeaderDateRef.current?.toDateString()) {
        stickyHeaderDateRef.current = date;
        setStickyHeaderDate(date);
      }
    },
  );

  return { stickyHeaderDate, updateStickyHeaderDate };
};
