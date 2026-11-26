import type { Channel, PaginatorState, ScheduledMessageResponse } from 'stream-chat';
import { getScheduledMessageLimits } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';
import { isPendingScheduledMessage } from '../utils/actions';

const pendingCountSelector = ({ items }: PaginatorState<ScheduledMessageResponse>) => ({
  pendingCount: items?.filter(isPendingScheduledMessage).length ?? 0,
});

/** The per-channel limit, which counts the channel's pending messages, thread replies included. */
export const useChannelScheduledMessageLimit = (channel: Channel) => {
  const { pendingCount } = useStateStore(
    channel.scheduledMessagesPaginator.state,
    pendingCountSelector,
  );
  const maxPerChannel = getScheduledMessageLimits(channel)?.maxPerChannel;

  return {
    isLimitReached: maxPerChannel !== undefined && pendingCount >= maxPerChannel,
    maxPerChannel,
    pendingCount,
  };
};
