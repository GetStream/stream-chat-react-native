import { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { data: Channel['data'] }) => ({
  name: state.data?.custom?.name,
});

/**
 * Returns the channel's name, sourced reactively from `channel.state` (updates on `channel.updated`).
 */
export function useChannelName(channel: Channel): string | undefined;
export function useChannelName(channel?: Channel): string | undefined;
export function useChannelName(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.name;
}
