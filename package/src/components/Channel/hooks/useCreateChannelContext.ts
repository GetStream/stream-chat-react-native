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
  maxTimeBetweenGroupedMessages,
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
      maxTimeBetweenGroupedMessages,
      hasPendingInitialTargetLoad,
      threadList,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, disabled, threadList],
  );

  return channelContext;
};
