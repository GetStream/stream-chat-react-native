import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';

export const useCreateChannelContext = ({
  channel,
  channelUnreadState,
  disabled,
  EmptyStateIndicator,
  enableMessageGroupingByUser,
  enforceUniqueReaction,
  error,
  hideDateSeparators,
  hideStickyDateHeader,
  highlightedMessageId,
  isChannelActive,
  lastRead,
  loadChannelAroundMessage,
  loadChannelAtFirstUnreadMessage,
  loading,
  LoadingIndicator,
  markRead,
  maxTimeBetweenGroupedMessages,
  members,
  NetworkDownIndicator,
  read,
  reloadChannel,
  scrollToFirstUnreadThreshold,
  setChannelUnreadState,
  setLastRead,
  setTargetedMessage,
  StickyHeader,
  targetedMessage,
  threadList,
  uploadAbortControllerRef,
  watcherCount,
  watchers,
}: ChannelContextValue) => {
  const channelId = channel?.id;
  const lastReadTime = lastRead?.getTime();
  const membersLength = Object.keys(members).length;

  const readUsers = Object.values(read);
  const readUsersLength = readUsers.length;
  const readUsersLastReads = readUsers.map(({ last_read }) => last_read.toISOString()).join();
  const stringifiedChannelUnreadState = JSON.stringify(channelUnreadState);

  const channelContext: ChannelContextValue = useMemo(
    () => ({
      channel,
      channelUnreadState,
      disabled,
      EmptyStateIndicator,
      enableMessageGroupingByUser,
      enforceUniqueReaction,
      error,
      hideDateSeparators,
      hideStickyDateHeader,
      highlightedMessageId,
      isChannelActive,
      lastRead,
      loadChannelAroundMessage,
      loadChannelAtFirstUnreadMessage,
      loading,
      LoadingIndicator,
      markRead,
      maxTimeBetweenGroupedMessages,
      members,
      NetworkDownIndicator,
      read,
      reloadChannel,
      scrollToFirstUnreadThreshold,
      setChannelUnreadState,
      setLastRead,
      setTargetedMessage,
      StickyHeader,
      targetedMessage,
      threadList,
      uploadAbortControllerRef,
      watcherCount,
      watchers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelId,
      disabled,
      error,
      isChannelActive,
      highlightedMessageId,
      lastReadTime,
      loading,
      membersLength,
      readUsersLength,
      readUsersLastReads,
      stringifiedChannelUnreadState,
      targetedMessage,
      threadList,
      watcherCount,
    ],
  );

  return channelContext;
};
