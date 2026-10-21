import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from './useChannelOwnCapabilities';

/**
 * Whether the current user can update the channel.
 *
 * @param channel The channel to check.
 * @returns True when the user has the `update-channel` capability.
 */
export const useCanEditChannel = (channel?: Channel) =>
  useChannelOwnCapabilities(channel)?.includes('update-channel') ?? false;
