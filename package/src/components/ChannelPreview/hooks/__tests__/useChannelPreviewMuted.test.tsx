import { act, renderHook } from '@testing-library/react-native';
import { Channel, StateStore } from 'stream-chat';

import { convertDateToTimestamp } from '../../../../mock-builders/generator/time';
import { useIsChannelMuted } from '../useIsChannelMuted';

describe('useChannelPreviewMuted', () => {
  const makeChannel = (muted = false) =>
    ({
      initialized: true,
      state: new StateStore({
        muteStatus: { createdAt: null, expiresAt: null, muted },
      }),
    }) as unknown as Channel;

  it('returns the current mute status from channel.state', () => {
    const channel = makeChannel(false);
    const { result } = renderHook(() => useIsChannelMuted(channel));
    expect(result.current.muted).toBe(false);
  });

  it('updates reactively when channel.state.muteStatus changes', () => {
    const channel = makeChannel(false);
    const { result } = renderHook(() => useIsChannelMuted(channel));
    expect(result.current.muted).toBe(false);

    act(() => {
      channel.state.partialNext({
        muteStatus: { createdAt: convertDateToTimestamp(), expiresAt: null, muted: true },
      });
    });

    expect(result.current.muted).toBe(true);
  });
});
