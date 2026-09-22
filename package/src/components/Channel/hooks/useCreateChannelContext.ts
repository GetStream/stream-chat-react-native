import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';

export const useCreateChannelContext = ({
  channel,
  disabled,
  enableMessageGroupingByUser,
  enforceUniqueReaction,
  hideDateSeparators,
  hideStickyDateHeader,
  isChannelActive,
  maxTimeBetweenGroupedMessages,
  maximumMessageLimit,
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
      isChannelActive,
      maximumMessageLimit,
      maxTimeBetweenGroupedMessages,
      scrollToFirstUnreadThreshold,
      hasPendingInitialTargetLoad,
      threadList,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, disabled, isChannelActive, threadList, maximumMessageLimit],
  );

  return channelContext;
};
