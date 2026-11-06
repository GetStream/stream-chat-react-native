import { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { data: Channel['data'] }) => ({
  name: state.data?.custom?.name,
});

/**
 * Returns the channel's name, read reactively from `channel.state` (updates on `channel.updated`).
 *
 * @param channel The channel to read from.
 * @returns The channel name.
 */
export function useChannelName(channel: Channel): string | undefined;
/** Same as above, for a channel that may be undefined. */
export function useChannelName(channel?: Channel): string | undefined;
export function useChannelName(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.name;
}
