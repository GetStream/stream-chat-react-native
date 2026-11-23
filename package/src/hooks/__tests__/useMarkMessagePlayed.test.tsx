import { cleanup, renderHook } from '@testing-library/react-native';

import type { Channel, LocalMessage } from 'stream-chat';

import { initiateClientWithChannels } from '../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../mock-builders/generator/message';
import { generateUser } from '../../mock-builders/generator/user';
import { useMarkMessagePlayed } from '../useMarkMessagePlayed';

type Props = { channel?: Channel; isPlaying: boolean; message?: LocalMessage };

describe('useMarkMessagePlayed', () => {
  let channel: Channel;
  let message: LocalMessage;

  beforeEach(async () => {
    const { channels } = await initiateClientWithChannels();
    channel = channels[0];
    jest.spyOn(channel, 'markMessagePlayed').mockResolvedValue(null);
    message = generateMessage({ user: generateUser({ id: 'other-user' }) }) as LocalMessage;
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  const renderMarkHook = (initialProps: Props) =>
    renderHook((props: Props) => useMarkMessagePlayed(props), { initialProps });

  it('marks the message when playback starts', () => {
    const { rerender } = renderMarkHook({ channel, isPlaying: false, message });
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();

    rerender({ channel, isPlaying: true, message });

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith(message);
  });

  it('marks media that is already playing, as with autoplay', () => {
    renderMarkHook({ channel, isPlaying: true, message });

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
  });

  it('does not mark again while playback continues', () => {
    const { rerender } = renderMarkHook({ channel, isPlaying: true, message });

    rerender({ channel, isPlaying: true, message: { ...message } });

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
  });

  it('does not mark without a channel or a message', () => {
    renderMarkHook({ isPlaying: true, message });
    renderMarkHook({ channel, isPlaying: true });

    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });
});
