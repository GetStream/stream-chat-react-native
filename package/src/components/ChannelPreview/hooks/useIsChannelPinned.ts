import type { Channel } from 'stream-chat';

import { useChannelMembershipState } from '../../../hooks/useChannelMembershipState';

export const useIsChannelPinned = (channel: Channel) => {
  const membership = useChannelMembershipState(channel);
  return membership?.pinned_at != null;
};
