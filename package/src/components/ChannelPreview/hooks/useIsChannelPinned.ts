import type { Channel } from 'stream-chat';

import { useChannelMembershipState } from '../../../hooks/useChannelMembershipState';

export const useIsChannelPinned = (channel: Channel) => {
  const membership = useChannelMembershipState(channel);
  return Boolean(membership?.pinned_at);
};
