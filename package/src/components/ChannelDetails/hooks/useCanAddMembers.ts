import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from '../../../hooks/useChannelOwnCapabilities';

/**
 * Whether the current user can add members to the channel.
 */
export const useCanAddMembers = (channel?: Channel) =>
  useChannelOwnCapabilities(channel)?.includes('update-channel-members') ?? false;
