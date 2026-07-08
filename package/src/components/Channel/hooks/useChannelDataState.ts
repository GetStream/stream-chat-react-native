import { useCallback, useState } from 'react';

import { Channel, LocalMessage, ChannelState as StreamChannelState } from 'stream-chat';

export const channelInitialState = {
  hasMore: true,
  hasMoreNewer: false,
  loading: false,
  loadingMore: false,
  loadingMoreRecent: false,
  members: {},
  messages: [],
  pinnedMessages: [],
  read: {},
  targetedMessageId: undefined,
  typing: {},
  watcherCount: 0,
  watchers: {},
};

/**
 * The ChannelMessagesState object
 */
export type ChannelMessagesState = {
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  loadingMoreRecent?: boolean;
  messages?: StreamChannelState['messages'];
  pinnedMessages?: StreamChannelState['pinnedMessages'];
  targetedMessageId?: string;
};

/**
 * The ChannelThreadState object
 */
export type ChannelThreadState = {
  thread: LocalMessage | null;
  threadHasMore?: boolean;
  threadLoadingMore?: boolean;
  threadMessages?: StreamChannelState['messages'];
};

/**
 * The ChannelState object
 */
export type ChannelState = ChannelMessagesState & {
  members?: StreamChannelState['members'];
  read?: StreamChannelState['read'];
  typing?: StreamChannelState['typing'];
  watcherCount?: number;
  watchers?: StreamChannelState['watchers'];
};

/**
 * The useChannelMessageDataState hook that handles the state for the channel messages.
 */
export const useChannelMessageDataState = (channel: Channel) => {
  const [state, setState] = useState<ChannelMessagesState>({
    hasMore: true,
    hasMoreNewer: false,
    loading: false,
    loadingMore: false,
    loadingMoreRecent: false,
    messages: channel?.state?.messages || [],
    pinnedMessages: channel?.state?.pinnedMessages || [],
    targetedMessageId: undefined,
  });

  const copyMessagesStateFromChannel = useCallback((channel: Channel) => {
    setState((prev) => ({
      ...prev,
      messages: [...channel.state.messages],
      pinnedMessages: [...channel.state.pinnedMessages],
    }));
  }, []);

  const loadInitialMessagesStateFromChannel = useCallback((channel: Channel, hasMore: boolean) => {
    setState((prev) => ({
      ...prev,
      hasMore,
      loading: false,
      messages: [...channel.state.messages],
      pinnedMessages: [...channel.state.pinnedMessages],
    }));
  }, []);

  const jumpToLatestMessage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasMoreNewer: false,
      loading: false,
      targetedMessageId: undefined,
    }));
  }, []);

  const jumpToMessageFinished = useCallback((hasMoreNewer: boolean, targetedMessageId: string) => {
    setState((prev) => ({
      ...prev,
      hasMoreNewer,
      loading: false,
      targetedMessageId,
    }));
  }, []);

  const loadMoreFinished = useCallback((hasMore: boolean, messages: ChannelState['messages']) => {
    setState((prev) => ({
      ...prev,
      hasMore,
      loadingMore: false,
      messages,
    }));
  }, []);

  const setLoadingMore = useCallback((loadingMore: boolean) => {
    setState((prev) => ({
      ...prev,
      loadingMore,
    }));
  }, []);

  const setLoadingMoreRecent = useCallback((loadingMoreRecent: boolean) => {
    setState((prev) => ({
      ...prev,
      loadingMoreRecent,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading,
    }));
  }, []);

  const loadMoreRecentFinished = useCallback(
    (hasMoreNewer: boolean, messages: ChannelState['messages']) => {
      setState((prev) => ({
        ...prev,
        hasMoreNewer,
        loadingMoreRecent: false,
        messages,
      }));
    },
    [],
  );

  return {
    copyMessagesStateFromChannel,
    jumpToLatestMessage,
    jumpToMessageFinished,
    loadInitialMessagesStateFromChannel,
    loadMoreFinished,
    loadMoreRecentFinished,
    setLoading,
    setLoadingMore,
    setLoadingMoreRecent,
    state,
  };
};

// Channel scalar state (members/read/typing/watchers) now comes reactively from
// stream-chat's channel.state StateStores (membersStore/readStore/typingStore/watcherStore),
// consumed directly via useStateStore — no React-state mirror needed.
