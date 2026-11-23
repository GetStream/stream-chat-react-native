import { cleanup, renderHook } from '@testing-library/react-native';

import type { Channel } from 'stream-chat';

import { initiateClientWithChannels } from '../../mock-builders/api/initiateClientWithChannels';
import { useMarkMessagePlayed } from '../useMarkMessagePlayed';

type Props = { channel?: Channel; hasStartedPlayback: boolean; messageId?: string };

describe('useMarkMessagePlayed', () => {
  let channel: Channel;

  beforeEach(async () => {
    const { channels } = await initiateClientWithChannels();
    channel = channels[0];
    jest.spyOn(channel, 'markMessagePlayed').mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  const renderMarkHook = (initialProps: Props) =>
    renderHook((props: Props) => useMarkMessagePlayed(props), { initialProps });

  it('marks the message once playback has started', () => {
    const { rerender } = renderMarkHook({ channel, hasStartedPlayback: false, messageId: 'm1' });
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();

    rerender({ channel, hasStartedPlayback: true, messageId: 'm1' });

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith('m1');
  });

  it('does not mark again while playback continues', () => {
    const { rerender } = renderMarkHook({ channel, hasStartedPlayback: true, messageId: 'm1' });

    rerender({ channel, hasStartedPlayback: true, messageId: 'm1' });

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
  });

  it('does not mark without a channel or a message ID', () => {
    renderMarkHook({ hasStartedPlayback: true, messageId: 'm1' });
    renderMarkHook({ channel, hasStartedPlayback: true });

    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });
});
