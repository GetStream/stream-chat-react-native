import { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { data: Channel['data'] }) => ({
  image: state.data?.custom?.image,
});

/**
 * Returns the channel's image, sourced reactively from `channel.state` (updates on `channel.updated`).
 */
export function useChannelImage(channel: Channel): string | undefined;
export function useChannelImage(channel?: Channel): string | undefined;
export function useChannelImage(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.image;
}
