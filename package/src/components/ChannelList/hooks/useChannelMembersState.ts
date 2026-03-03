import { Channel, ChannelMemberResponse, EventTypes } from 'stream-chat';

import { useSelectedChannelState } from '../../../hooks/useSelectedChannelState';

const selector = (channel: Channel) => channel.state.members;
const keys: EventTypes[] = [
  'member.added',
  'member.updated',
  'member.removed',
  'user.banned',
  'user.unbanned',
  'user.presence.changed',
  'user.updated',
];
export function useChannelMembersState(channel: Channel): Record<string, ChannelMemberResponse>;
export function useChannelMembersState(
  channel?: Channel,
): Record<string, ChannelMemberResponse> | undefined;
export function useChannelMembersState(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
