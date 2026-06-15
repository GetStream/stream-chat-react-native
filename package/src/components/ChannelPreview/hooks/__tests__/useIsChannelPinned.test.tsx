import { renderHook } from '@testing-library/react-native';
import { Channel } from 'stream-chat';

import { useIsChannelPinned } from '../useIsChannelPinned';

describe('useIsChannelPinned', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const buildMockChannel = (membership: Record<string, unknown> = {}) =>
    ({
      initialized: true,
      on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      state: { membership },
    }) as unknown as Channel;

  it('returns false when membership has no pinned_at', () => {
    const channel = buildMockChannel({ pinned_at: null });
    const { result } = renderHook(() => useIsChannelPinned(channel));
    expect(result.current).toBe(false);
  });

  it('returns true when membership has a pinned_at timestamp', () => {
    const channel = buildMockChannel({ pinned_at: '2026-06-15T08:00:00.000Z' });
    const { result } = renderHook(() => useIsChannelPinned(channel));
    expect(result.current).toBe(true);
  });

  it('subscribes to member.updated events', () => {
    const channel = buildMockChannel({ pinned_at: null });
    renderHook(() => useIsChannelPinned(channel));
    expect(channel.on).toHaveBeenCalledWith('member.updated', expect.any(Function));
  });
});
