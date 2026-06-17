import { Channel, EventTypes } from 'stream-chat';

import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (channel: Channel) => channel.data?.name;
const keys: EventTypes[] = ['channel.updated'];

export function useChannelName(channel: Channel): string | undefined;
export function useChannelName(channel?: Channel): string | undefined;
export function useChannelName(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
