import { useMemo } from 'react';

import type { LocalMessage } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

import { useRAFCoalescedValue, useStateStore } from '../../../hooks';
import { usePrunableMessageList } from '../../../hooks/usePrunableMessageList';

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

const EMPTY_MESSAGES: LocalMessage[] = [];

const messageListSelector = (state: { items?: LocalMessage[] }) => ({ messages: state.items });

export const useMessageList = (params: UseMessageListParams) => {
  const { threadList, isLiveStreaming, isFlashList = false } = params;
  const { channel } = useChannelContext();
  const { threadInstance } = useThreadContext();
  const messagePaginator = threadList ? threadInstance?.messagePaginator : channel.messagePaginator;
  const { messages } = useStateStore(messagePaginator?.state, messageListSelector) ?? {};
  const { maxLoadedItems, viewabilityChangedCallback } = usePrunableMessageList({
    paginator: messagePaginator,
  });
  const messageList = messages ?? EMPTY_MESSAGES;

  const processedMessageList = useMemo<LocalMessage[]>(
    () => (isFlashList ? messageList.slice() : messageList.slice().reverse()),
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
      /** Messages enriched with dates/readby/groups and also reversed in order */
      processedMessageList: data,
      /** Raw messages from the channel state */
      rawMessageList: messageList,
      viewabilityChangedCallback,
    }),
    [data, messageList, maxLoadedItems, viewabilityChangedCallback],
  );
};
