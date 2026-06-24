import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from './useChannelOwnCapabilities';

/**
 * Whether the current user can update (edit) the channel.
 */
export const useCanEdit = (channel?: Channel) =>
  useChannelOwnCapabilities(channel)?.includes('update-channel') ?? false;
