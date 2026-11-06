import { StateStore } from '@stream-io/state-store';
import { act, renderHook } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMembersState } from '../useChannelMembersState';

const member = (id: string, name: string, online = false) =>
  ({ user: { id, name, online } }) as unknown as ChannelMemberResponse;

const pickName = (m: ChannelMemberResponse) => ({ name: m.user?.name });

describe('useChannelMembersState', () => {
  let state: StateStore<{ members: Record<string, ChannelMemberResponse> }>;
  let channel: Channel;

  beforeEach(() => {
    state = new StateStore<{ members: Record<string, ChannelMemberResponse> }>({
      members: { a: member('a', 'A'), b: member('b', 'B') },
    });
    channel = { cid: 'messaging:test', state } as unknown as Channel;
  });

  const renderCounted = (pick?: typeof pickName) => {
    let renders = 0;
    const hook = renderHook(() => {
      renders += 1;
      return useChannelMembersState(channel, pick);
    });
    const rendersBefore = renders;
    return { ...hook, rendersSince: () => renders - rendersBefore };
  };

  it('re-renders on every members change without a pick', () => {
    const { rendersSince } = renderCounted();

    act(() => state.next({ members: { a: member('a', 'A', true), b: member('b', 'B') } }));

    expect(rendersSince()).toBe(1);
  });

  it('keeps the members when no picked field changed', () => {
    const { result, rendersSince } = renderCounted(pickName);
    const members = result.current;

    act(() => state.next({ members: { a: member('a', 'A', true), b: member('b', 'B') } }));

    expect(rendersSince()).toBe(0);
    expect(result.current).toBe(members);
  });

  it('updates when a picked field changes', () => {
    const { result } = renderCounted(pickName);

    act(() => state.next({ members: { a: member('a', 'Renamed'), b: member('b', 'B') } }));

    expect(result.current.a.user?.name).toBe('Renamed');
  });

  it('updates when a member leaves', () => {
    const { result } = renderCounted(pickName);

    act(() => state.next({ members: { a: member('a', 'A') } }));

    expect(Object.keys(result.current)).toEqual(['a']);
  });
});
