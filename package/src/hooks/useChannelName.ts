import { Channel, EventType } from 'stream-chat';

import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (channel: Channel) => channel.data?.custom?.name;
const keys: EventType[] = ['channel.updated'];

export function useChannelName(channel: Channel): string | undefined;
export function useChannelName(channel?: Channel): string | undefined;
export function useChannelName(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
