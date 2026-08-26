import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';

export const useCreateChannelContext = ({
  channel,
  disabled,
  enableMessageGroupingByUser,
  enforceUniqueReaction,
  hideDateSeparators,
  hideStickyDateHeader,
  highlightedMessageId,
  isChannelActive,
  loadChannelAroundMessage,
  loadChannelAtFirstUnreadMessage,
  loading,
  maxTimeBetweenGroupedMessages,
  maximumMessageLimit,
  reloadChannel,
  scrollToFirstUnreadThreshold,
  hasPendingInitialTargetLoad,
  threadList,
}: ChannelContextValue) => {
  const channelId = channel?.id;

  const channelContext: ChannelContextValue = useMemo(
    () => ({
      channel,
      disabled,
      enableMessageGroupingByUser,
      enforceUniqueReaction,
      hideDateSeparators,
      hideStickyDateHeader,
      highlightedMessageId,
      isChannelActive,
      loadChannelAroundMessage,
      loadChannelAtFirstUnreadMessage,
      loading,
      maximumMessageLimit,
      maxTimeBetweenGroupedMessages,
      reloadChannel,
      scrollToFirstUnreadThreshold,
      hasPendingInitialTargetLoad,
      threadList,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelId,
      disabled,
      isChannelActive,
      highlightedMessageId,
      loading,
      threadList,
      maximumMessageLimit,
    ],
  );

  return channelContext;
};
