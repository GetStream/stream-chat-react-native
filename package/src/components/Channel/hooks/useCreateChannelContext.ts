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
    }),
    // Keyed on the instance too, as a superseded instance shares its ID with its successor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channel, disabled],
  );

  return channelContext;
};
