import type { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { ownCapabilities: string[] }) => ({
  ownCapabilities: state.ownCapabilities,
});

/**
 * Returns the current user's capabilities for the channel, sourced reactively from
 * `channel.state`.
 */
export function useChannelOwnCapabilities(channel?: Channel): string[] | undefined {
  return useStateStore(channel?.state, selector)?.ownCapabilities;
}
