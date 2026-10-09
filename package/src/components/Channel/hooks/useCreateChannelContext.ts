import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';

export const useCreateChannelContext = ({
  channel,
  disabled,
  enableMessageGroupingByUser,
  enforceUniqueReaction,
  allowDateSeparatorForSystemMessages,
  hideDateSeparators,
  hideStickyDateHeader,
  isChannelActive,
  maxTimeBetweenGroupedMessages,
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
      allowDateSeparatorForSystemMessages,
      hideDateSeparators,
      hideStickyDateHeader,
      isChannelActive,
      maxTimeBetweenGroupedMessages,
      scrollToFirstUnreadThreshold,
      hasPendingInitialTargetLoad,
      threadList,
    }),
    // Keyed on the instance as well, since a superseded instance shares its id with its successor
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channel, channelId, disabled, isChannelActive, threadList],
  );

  return channelContext;
};
