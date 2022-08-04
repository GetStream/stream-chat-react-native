import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateChannelContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  disabled,
  EmptyStateIndicator,
  enableMessageGroupingByUser,
  enforceUniqueReaction,
  error,
  giphyEnabled,
  hideDateSeparators,
  hideStickyDateHeader,
  isAdmin,
  isChannelActive,
  isModerator,
  isOwner,
  lastRead,
  loadChannelAroundMessage,
  loadChannelAtMessage,
  loading,
  LoadingIndicator,
  markRead,
  maxTimeBetweenGroupedMessages,
  members,
  NetworkDownIndicator,
  read,
  reloadChannel,
  scrollToFirstUnreadThreshold,
  setLastRead,
  setTargetedMessage,
  StickyHeader,
  targetedMessage,
  threadList,
  watcherCount,
  watchers,
}: ChannelContextValue<StreamChatGenerics>) => {
  const channelId = channel?.id;
  const lastReadTime = lastRead?.getTime();
  const membersLength = Object.keys(members).length;

  const readUsers = Object.values(read);
  const readUsersLength = readUsers.length;
  const readUsersLastReads = readUsers.map(({ last_read }) => last_read.toISOString()).join();

  const channelContext: ChannelContextValue<StreamChatGenerics> = useMemo(
    () => ({
      channel,
      disabled,
      EmptyStateIndicator,
      enableMessageGroupingByUser,
      enforceUniqueReaction,
      error,
      giphyEnabled,
      hideDateSeparators,
      hideStickyDateHeader,
      isAdmin,
      isChannelActive,
      isModerator,
      isOwner,
      lastRead,
      loadChannelAroundMessage,
      loadChannelAtMessage,
      loading,
      LoadingIndicator,
      markRead,
      maxTimeBetweenGroupedMessages,
      members,
      NetworkDownIndicator,
      read,
      reloadChannel,
      scrollToFirstUnreadThreshold,
      setLastRead,
      setTargetedMessage,
      StickyHeader,
      targetedMessage,
      threadList,
      watcherCount,
      watchers,
    }),
    [
      channelId,
      disabled,
      error,
      isChannelActive,
      lastReadTime,
      loading,
      membersLength,
      readUsersLength,
      readUsersLastReads,
      targetedMessage,
      threadList,
      watcherCount,
    ],
  );

  return channelContext;
};
