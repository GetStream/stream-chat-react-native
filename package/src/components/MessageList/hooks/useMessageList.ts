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
  maximumMessageLimit?: number;
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
  const { threadList, isLiveStreaming, isFlashList = false, maximumMessageLimit } = params;
  const { channel } = useChannelContext();
  // The channel message list is sourced reactively from channel.messagePaginator (channel-specific,
  // NOT the thread-aware useMessagePaginator — so the main list keeps showing channel messages while
  // a thread is open). Thread reply lists read threadMessages from the ThreadContext instead.
  const { messages } = useStateStore(channel.messagePaginator.state, messageListSelector) ?? {};
  const { viewabilityChangedCallback } = usePrunableMessageList({
    maximumMessageLimit,
    setMessages: () => {},
  });
  const { threadMessages } = useThreadContext();
  const messageList = (threadList ? threadMessages : messages) ?? EMPTY_MESSAGES;

  const processedMessageList = useMemo<LocalMessage[]>(() => {
    const newMessageList: LocalMessage[] = [];
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
