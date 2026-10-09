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
    // Keyed on the instance as well, since a superseded instance shares its id with its successor
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channel, disabled, threadList],
  );

  return channelContext;
};
