import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

type MembersState = { members: Record<string, ChannelMemberResponse> };

/**
 * The fields of a member a caller reads. Define it at module scope, so it stays the same function.
 */
export type ChannelMemberPick = (member: ChannelMemberResponse) => Record<string, unknown>;

const selector = (state: MembersState) => ({
  members: state.members,
});

const isShallowEqual = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => Object.is(a[key], b[key]));
};

// keeps the previous members while every member's picked fields are unchanged
const createPickedMembersSelector = (pick: ChannelMemberPick) => {
  let previous: { members: MembersState['members']; picked: Record<string, unknown>[] } | undefined;
  return (state: MembersState) => {
    const picked = Object.values(state.members).map(pick);
    const last = previous;
    if (
      last &&
      picked.length === last.picked.length &&
      picked.every((fields, i) => isShallowEqual(fields, last.picked[i]))
    ) {
      return { members: last.members };
    }
    previous = { members: state.members, picked };
    return { members: state.members };
  };
};

/**
 * Returns the channel's members, sourced reactively from `channel.state`.
 *
 * With `pick`, the members update only when one of the picked fields changes for some member, or
 * when members join or leave. A presence change replaces every member object of that user, so a caller
 * that does not read `online` should pick what it reads to skip those re-renders.
 */
export function useChannelMembersState(
  channel: Channel,
  pick?: ChannelMemberPick,
): Record<string, ChannelMemberResponse>;
export function useChannelMembersState(
  channel?: Channel,
  pick?: ChannelMemberPick,
): Record<string, ChannelMemberResponse> | undefined;
export function useChannelMembersState(channel?: Channel, pick?: ChannelMemberPick) {
  const membersSelector = useMemo(
    () => (pick ? createPickedMembersSelector(pick) : selector),
    [pick],
  );
  return useStateStore(channel?.state, membersSelector)?.members;
}
