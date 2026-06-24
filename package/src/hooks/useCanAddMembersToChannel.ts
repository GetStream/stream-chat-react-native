import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from './useChannelOwnCapabilities';

/**
 * Whether the current user can add members to the channel.
 */
export const useCanAddMembersToChannel = (channel?: Channel) =>
  useChannelOwnCapabilities(channel)?.includes('update-channel-members') ?? false;
