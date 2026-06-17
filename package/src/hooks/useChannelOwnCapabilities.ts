import { Channel, EventTypes } from 'stream-chat';

import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (channel: Channel) => channel.data?.own_capabilities as string[] | undefined;
const keys: EventTypes[] = ['capabilities.changed'];

export function useChannelOwnCapabilities(channel: Channel): string[] | undefined;
export function useChannelOwnCapabilities(channel?: Channel): string[] | undefined;
export function useChannelOwnCapabilities(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
