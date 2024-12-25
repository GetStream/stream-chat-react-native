import { useCallback, useState } from 'react';

import { Channel, ChannelState as StreamChannelState } from 'stream-chat';

import { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageType } from '../../MessageList/hooks/useMessageList';

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
export type ChannelMessagesState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  loadingMoreRecent?: boolean;
  messages?: StreamChannelState<StreamChatGenerics>['messages'];
  pinnedMessages?: StreamChannelState<StreamChatGenerics>['pinnedMessages'];
  targetedMessageId?: string;
};

/**
 * The ChannelThreadState object
 */
export type ChannelThreadState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  thread: MessageType<StreamChatGenerics> | null;
  threadHasMore?: boolean;
  threadLoadingMore?: boolean;
  threadMessages?: StreamChannelState<StreamChatGenerics>['messages'];
};

/**
 * The ChannelState object
 */
export type ChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ChannelMessagesState<StreamChatGenerics> & {
  members?: StreamChannelState<StreamChatGenerics>['members'];
  read?: StreamChannelState<StreamChatGenerics>['read'];
  typing?: StreamChannelState<StreamChatGenerics>['typing'];
  watcherCount?: number;
  watchers?: StreamChannelState<StreamChatGenerics>['watchers'];
};

/**
 * The useChannelMessageDataState hook that handles the state for the channel messages.
 */
export const useChannelMessageDataState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const [state, setState] = useState<ChannelMessagesState<StreamChatGenerics>>({
    hasMore: true,
    hasMoreNewer: false,
    loading: false,
    loadingMore: false,
    loadingMoreRecent: false,
    messages: channel?.state?.messages || [],
    pinnedMessages: channel?.state?.pinnedMessages || [],
    targetedMessageId: undefined,
  });

  const copyMessagesStateFromChannel = useCallback((channel: Channel<StreamChatGenerics>) => {
    setState((prev) => ({
      ...prev,
      messages: [...channel.state.messages],
      pinnedMessages: [...channel.state.pinnedMessages],
    }));
  }, []);

  const loadInitialMessagesStateFromChannel = useCallback(
    (channel: Channel<StreamChatGenerics>, hasMore: boolean) => {
      setState((prev) => ({
        ...prev,
        hasMore,
        loading: false,
        messages: [...channel.state.messages],
        pinnedMessages: [...channel.state.pinnedMessages],
      }));
    },
    [],
  );

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

  const loadMoreFinished = useCallback(
    (hasMore: boolean, messages: ChannelState<StreamChatGenerics>['messages']) => {
      setState((prev) => ({
        ...prev,
        hasMore,
        loadingMore: false,
        messages,
      }));
    },
    [],
  );

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
    (hasMoreNewer: boolean, messages: ChannelState<StreamChatGenerics>['messages']) => {
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

/**
 * The useChannelThreadState hook that handles the state for the channel member, read, typing, watchers, etc.
 */
export const useChannelDataState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const [state, setState] = useState<ChannelState<StreamChatGenerics>>({
    members: channel.state.members,
    read: channel.state.read,
    typing: {},
    watcherCount: 0,
    watchers: {},
  });

  const initStateFromChannel = useCallback(
    (channel: Channel<StreamChatGenerics>) => {
      setState({
        ...state,
        members: { ...channel.state.members },
        read: { ...channel.state.read },
        typing: { ...channel.state.typing },
        watcherCount: channel.state.watcher_count,
        watchers: { ...channel.state.watchers },
      });
    },
    [state],
  );

  const copyStateFromChannel = useCallback((channel: Channel<StreamChatGenerics>) => {
    setState((prev) => ({
      ...prev,
      members: { ...channel.state.members },
      read: { ...channel.state.read },
      watcherCount: channel.state.watcher_count,
      watchers: { ...channel.state.watchers },
    }));
  }, []);

  const setRead = useCallback((channel: Channel<StreamChatGenerics>) => {
    setState((prev) => ({
      ...prev,
      read: { ...channel.state.read }, // Synchronize the read state from the channel
    }));
  }, []);

  const setTyping = useCallback((channel: Channel<StreamChatGenerics>) => {
    setState((prev) => ({
      ...prev,
      typing: { ...channel.state.typing }, // Synchronize the typing state from the channel
    }));
  }, []);

  return {
    copyStateFromChannel,
    initStateFromChannel,
    setRead,
    setTyping,
    state,
  };
};
