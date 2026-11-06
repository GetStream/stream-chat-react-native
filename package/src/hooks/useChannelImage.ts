import { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { data: Channel['data'] }) => ({
  image: state.data?.custom?.image,
});

/**
 * Returns the channel's image, read reactively from `channel.state` (updates on `channel.updated`).
 *
 * @param channel The channel to read from.
 * @returns The channel image.
 */
export function useChannelImage(channel: Channel): string | undefined;
/** Same as above, for a channel that may be undefined. */
export function useChannelImage(channel?: Channel): string | undefined;
export function useChannelImage(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.image;
}
