import type { Channel, ChannelConfig } from 'stream-chat';

import { useChannelOwnCapabilities } from './useChannelOwnCapabilities';
import { useStateStore } from './useStateStore';

const enabledByConfigSelector = ({ scheduledMessages }: ChannelConfig) => ({
  isEnabledByConfig: scheduledMessages.enabled,
});

/**
 * Whether the current user can schedule messages in the channel, i.e. `channel.scheduledMessagesEnabled`.
 * Subscribing to the user's capabilities and the scheduled messages config re-renders when either changes.
 *
 * @param channel The channel to check.
 * @returns True when the config allows scheduling and the user has the `schedule-message` capability.
 */
export const useCanScheduleMessages = (channel?: Channel) => {
  useChannelOwnCapabilities(channel);
  useStateStore(channel?.configState, enabledByConfigSelector);
  return channel?.scheduledMessagesEnabled ?? false;
};
