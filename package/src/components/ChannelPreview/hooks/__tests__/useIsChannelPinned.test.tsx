import { act, renderHook } from '@testing-library/react-native';
import { Channel, ChannelMemberResponse, StateStore } from 'stream-chat';

import { convertDateToTimestamp } from '../../../../mock-builders/generator/time';
import { useIsChannelPinned } from '../useIsChannelPinned';

describe('useIsChannelPinned', () => {
  const buildMockChannel = (membership: Record<string, unknown> = {}) =>
    ({
      initialized: true,
      state: new StateStore({ membership }),
    }) as unknown as Channel;

  it('returns false when membership has no pinned_at', () => {
    const channel = buildMockChannel({ pinned_at: null });
    const { result } = renderHook(() => useIsChannelPinned(channel));
    expect(result.current).toBe(false);
  });

  it('returns true when membership has a pinned_at timestamp', () => {
    const channel = buildMockChannel({
      pinned_at: convertDateToTimestamp('2026-06-15T08:00:00.000Z'),
    });
    const { result } = renderHook(() => useIsChannelPinned(channel));
    expect(result.current).toBe(true);
  });

  it('updates reactively when channel.state.membership changes', () => {
    const channel = buildMockChannel({ pinned_at: null });
    const { result } = renderHook(() => useIsChannelPinned(channel));
    expect(result.current).toBe(false);

    act(() => {
      channel.state.partialNext({
        membership: {
          pinned_at: convertDateToTimestamp('2026-06-15T08:00:00.000Z'),
        } as ChannelMemberResponse,
      });
    });

    expect(result.current).toBe(true);
  });
});
