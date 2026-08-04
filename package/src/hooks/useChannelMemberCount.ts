import { Channel, EventType } from 'stream-chat';

import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (channel: Channel) => channel.data?.member_count ?? 0;
const keys: EventType[] = ['channel.updated'];

export function useChannelMemberCount(channel: Channel): number;
export function useChannelMemberCount(channel?: Channel): number | undefined;
export function useChannelMemberCount(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
