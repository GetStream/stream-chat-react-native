import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from '../../../hooks/useChannelOwnCapabilities';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';

/**
 * Whether the channel-details edit button should be visible: the current user can update the
 * channel and the channel is not a direct (1:1) chat.
 */
export const useIsEditButtonVisible = (channel?: Channel) => {
  const ownCapabilities = useChannelOwnCapabilities(channel);
  const isDirect = useIsDirectChat(channel);
  return (ownCapabilities?.includes('update-channel') ?? false) && !isDirect;
};
