import { Channel, EventType } from 'stream-chat';

import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (channel: Channel) => channel.data?.custom?.image;
const keys: EventType[] = ['channel.updated'];

export function useChannelImage(channel: Channel): string | undefined;
export function useChannelImage(channel?: Channel): string | undefined;
export function useChannelImage(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
