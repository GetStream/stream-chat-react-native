import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from '../../../hooks/useChannelOwnCapabilities';

/**
 * Whether the channel-details add-member button should be visible: the current user can update
 * the channel members.
 */
export const useIsAddMemberButtonVisible = (channel?: Channel) =>
  useChannelOwnCapabilities(channel)?.includes('update-channel-members') ?? false;
