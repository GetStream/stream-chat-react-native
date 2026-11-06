import type { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { ownCapabilities: string[] }) => ({
  ownCapabilities: state.ownCapabilities,
});

/**
 * Returns the current user's capabilities for the channel, read reactively from `channel.state`.
 *
 * @param channel The channel to read from.
 * @returns The own capabilities.
 */
export function useChannelOwnCapabilities(channel?: Channel): string[] | undefined {
  return useStateStore(channel?.state, selector)?.ownCapabilities;
}
