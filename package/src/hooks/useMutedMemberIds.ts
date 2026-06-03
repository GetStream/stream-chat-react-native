import { useMemo } from 'react';

import { Channel } from 'stream-chat';

import { useMutedUsers } from '../components/ChannelList/hooks/useMutedUsers';

/**
 * Returns the set of user ids the current user has muted in the given channel,
 * derived from a single `useMutedUsers` subscription. Call once at the list level
 * and pass per-row membership down as a boolean — avoids one client subscription
 * per rendered row.
 */
export const useMutedMemberIds = (channel: Channel): Set<string> => {
  const mutedUsers = useMutedUsers(channel);
  return useMemo(() => new Set((mutedUsers ?? []).map((mute) => mute.target.id)), [mutedUsers]);
};
