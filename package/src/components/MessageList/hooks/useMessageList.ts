import { useMemo } from 'react';

import type { LocalMessage } from 'stream-chat';

import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

import { useRAFCoalescedValue } from '../../../hooks';

export type UseMessageListParams = {
  threadList?: boolean;
  isLiveStreaming?: boolean;
  isFlashList?: boolean;
};

/**
 * FIXME: To change it to a more specific type.
 */
export type GroupType = string;

export type MessageGroupStyles = {
  [key: string]: string[];
};

export const useMessageList = (params: UseMessageListParams) => {
  const { threadList, isLiveStreaming, isFlashList = false } = params;
  const { messages, viewabilityChangedCallback } = usePaginatedMessageListContext();
  const { threadMessages } = useThreadContext();
  const messageList = threadList ? threadMessages : messages;

  const processedMessageList = useMemo<LocalMessage[]>(() => {
    const newMessageList = [];
    for (const message of messageList) {
      if (isFlashList) {
        newMessageList.push(message);
      } else {
        newMessageList.unshift(message);
      }
    }
    return newMessageList;
  }, [messageList, isFlashList]);

  const data = useRAFCoalescedValue(processedMessageList, isLiveStreaming);

  return useMemo(
    () => ({
      /** Messages enriched with dates/readby/groups and also reversed in order */
      processedMessageList: data,
      /** Raw messages from the channel state */
      rawMessageList: messageList,
      viewabilityChangedCallback,
    }),
    [data, messageList, viewabilityChangedCallback],
  );
};
