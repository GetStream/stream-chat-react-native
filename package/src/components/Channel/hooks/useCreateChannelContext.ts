import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';

export const useCreateChannelContext = ({
  channel,
  channelUnreadStateStore,
  disabled,
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
  markRead,
  maxTimeBetweenGroupedMessages,
  maximumMessageLimit,
  members,
  read,
  reloadChannel,
  scrollToFirstUnreadThreshold,
  setChannelUnreadState,
  setLastRead,
  setTargetedMessage,
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
  const readUsersLastReads = readUsers
    .map(({ last_read }) => last_read?.toISOString() ?? '')
    .join();

  const channelContext: ChannelContextValue = useMemo(
    () => ({
      channel,
      channelUnreadStateStore,
      disabled,
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
      markRead,
      maximumMessageLimit,
      maxTimeBetweenGroupedMessages,
      members,
      read,
      reloadChannel,
      scrollToFirstUnreadThreshold,
      setChannelUnreadState,
      setLastRead,
      setTargetedMessage,
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
      targetedMessage,
      threadList,
      watcherCount,
      maximumMessageLimit,
    ],
  );

  return channelContext;
};
