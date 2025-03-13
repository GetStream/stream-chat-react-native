import { Channel, ChannelMemberResponse, EventTypes } from 'stream-chat';

import { useSelectedChannelState } from '../../../hooks/useSelectedChannelState';

const selector = (channel: Channel) => channel.state.membership;
const keys: EventTypes[] = ['member.updated'];

export function useChannelMembershipState(channel: Channel): ChannelMemberResponse;
export function useChannelMembershipState(channel?: Channel): ChannelMemberResponse | undefined;
export function useChannelMembershipState(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
