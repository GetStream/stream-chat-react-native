import { act, renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { generateChannelState } from '../../mock-builders/generator/channelState';
import { useDisplayedChannelMemberCount } from '../useDisplayedChannelMemberCount';

const buildChannel = (counts: { activeMemberCount?: number; memberCount: number }) =>
  ({ cid: 'messaging:test', state: generateChannelState(counts) }) as unknown as Channel;

describe('useDisplayedChannelMemberCount', () => {
  it('falls back to the member count when the active member count is unknown', () => {
    const channel = buildChannel({ memberCount: 10 });

    const { result } = renderHook(() => useDisplayedChannelMemberCount(channel));

    expect(result.current).toBe(10);
  });

  it('prefers the active member count', () => {
    const channel = buildChannel({ activeMemberCount: 8, memberCount: 10 });

    const { result } = renderHook(() => useDisplayedChannelMemberCount(channel));

    expect(result.current).toBe(8);
  });

  it('shows an active member count of zero', () => {
    const channel = buildChannel({ activeMemberCount: 0, memberCount: 10 });

    const { result } = renderHook(() => useDisplayedChannelMemberCount(channel));

    expect(result.current).toBe(0);
  });

  it('follows changes to the channel state', () => {
    const channel = buildChannel({ memberCount: 10 });

    const { result } = renderHook(() => useDisplayedChannelMemberCount(channel));
    expect(result.current).toBe(10);

    act(() => channel.state.partialNext({ activeMemberCount: 7, memberCount: 11 }));

    expect(result.current).toBe(7);
  });
});
