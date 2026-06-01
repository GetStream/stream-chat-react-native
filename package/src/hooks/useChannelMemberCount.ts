import { Channel, EventTypes } from 'stream-chat';

import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (channel: Channel) => channel.data?.member_count ?? 0;
const keys: EventTypes[] = ['member.added', 'member.removed'];

export function useChannelMemberCount(channel: Channel): number;
export function useChannelMemberCount(channel?: Channel): number | undefined;
export function useChannelMemberCount(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
