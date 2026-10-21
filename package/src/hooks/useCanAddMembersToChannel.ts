import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from './useChannelOwnCapabilities';

/**
 * Whether the current user can add members to the channel.
 *
 * @param channel The channel to check.
 * @returns True when the user has the `update-channel-members` capability.
 */
export const useCanAddMembersToChannel = (channel?: Channel) =>
  useChannelOwnCapabilities(channel)?.includes('update-channel-members') ?? false;
