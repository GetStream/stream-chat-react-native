import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';

export const useCreateChannelContext = ({
  channel,
  disabled,
  enableMessageGroupingByUser,
  enforceUniqueReaction,
  error,
  hideDateSeparators,
  hideStickyDateHeader,
  highlightedMessageId,
  isChannelActive,
  loadChannelAroundMessage,
  loadChannelAtFirstUnreadMessage,
  loading,
  markRead,
  maxTimeBetweenGroupedMessages,
  maximumMessageLimit,
  reloadChannel,
  scrollToFirstUnreadThreshold,
  hasPendingInitialTargetLoad,
  threadList,
  uploadAbortControllerRef,
}: ChannelContextValue) => {
  const channelId = channel?.id;

  const channelContext: ChannelContextValue = useMemo(
    () => ({
      channel,
      disabled,
      enableMessageGroupingByUser,
      enforceUniqueReaction,
      error,
      hideDateSeparators,
      hideStickyDateHeader,
      highlightedMessageId,
      isChannelActive,
      loadChannelAroundMessage,
      loadChannelAtFirstUnreadMessage,
      loading,
      markRead,
      maximumMessageLimit,
      maxTimeBetweenGroupedMessages,
      reloadChannel,
      scrollToFirstUnreadThreshold,
      hasPendingInitialTargetLoad,
      threadList,
      uploadAbortControllerRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelId,
      disabled,
      error,
      isChannelActive,
      highlightedMessageId,
      loading,
      threadList,
      maximumMessageLimit,
    ],
  );

  return channelContext;
};
