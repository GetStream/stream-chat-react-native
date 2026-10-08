import { useMemo } from 'react';

import type { LocalMessage, MessagePaginator } from 'stream-chat';

import { useRAFCoalescedValue, useStateStore } from '../../../hooks';
import { usePrunableMessageList } from '../../../hooks/usePrunableMessageList';

export type UseMessageListParams = {
  /** The paginator the list renders: the channel's, or the open thread's in a thread list. */
  paginator: MessagePaginator | undefined;
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

const EMPTY_MESSAGES: LocalMessage[] = [];

const messageListSelector = (state: { items?: LocalMessage[] }) => ({ messages: state.items });

export const useMessageList = (params: UseMessageListParams) => {
  const { isLiveStreaming, isFlashList = false, paginator } = params;
  const { messages } = useStateStore(paginator?.state, messageListSelector) ?? {};
  const { maxLoadedItems, viewabilityChangedCallback } = usePrunableMessageList({ paginator });
  const messageList = messages ?? EMPTY_MESSAGES;

  const processedMessageList = useMemo<LocalMessage[]>(
    () => (isFlashList ? messageList : messageList.slice().reverse()),
    [messageList, isFlashList],
  );

  const data = useRAFCoalescedValue(processedMessageList, isLiveStreaming);

  return useMemo(
    () => ({
      /**
       * The paginator's configured window cap, or `undefined` when the list is unbounded. Read from
       * the paginator rather than a prop — it is state-layer configuration.
       */
      maxLoadedItems,
      /** Render order: newest first for the inverted FlatList, oldest first for FlashList. */
      processedMessageList: data,
      /** The paginator's messages, oldest first. */
      rawMessageList: messageList,
      viewabilityChangedCallback,
    }),
    [data, messageList, maxLoadedItems, viewabilityChangedCallback],
  );
};
