import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';

import { msToNs } from 'stream-chat';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { ChatProvider } from '../../../chatContext/ChatContext';
import { useHandleLiveLocationEvents } from '../useHandleLiveLocationEvents';

const sharedLocation = (messageId: string, endAtMs: number) => ({
  channel_cid: 'messaging:location',
  created_by_device_id: 'device',
  end_at: msToNs(endAtMs),
  latitude: 1,
  longitude: 2,
  message_id: messageId,
});

describe('useHandleLiveLocationEvents', () => {
  let client: StreamChat;
  let channel: Channel;

  const wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>{children}</ChatProvider>
  );

  const updateMessage = (id: string, endAtMs: number) =>
    act(() => {
      client.dispatchEvent({
        cid: channel.cid,
        message: generateMessage({
          id,
          shared_location: sharedLocation(id, endAtMs) as never,
        }) as unknown as LocalMessage,
        type: 'message.updated',
      } as never);
    });

  beforeEach(async () => {
    ({
      channels: [channel],
      client,
    } = await initiateClientWithChannels());
  });

  it('is not stopped by another message whose share ended', () => {
    const { result } = renderHook(
      () => useHandleLiveLocationEvents({ channel, messageId: 'watched' }),
      { wrapper },
    );

    updateMessage('other', Date.now() - 60_000);

    expect(result.current.isLiveLocationStopped).toBeNull();
    expect(result.current.locationResponse).toBeUndefined();
  });

  it('stops when its own share ends', () => {
    const { result } = renderHook(
      () => useHandleLiveLocationEvents({ channel, messageId: 'watched' }),
      { wrapper },
    );

    updateMessage('watched', Date.now() + 60_000);
    expect(result.current.isLiveLocationStopped).toBeNull();
    expect(result.current.locationResponse?.message_id).toBe('watched');

    updateMessage('watched', Date.now() - 60_000);
    expect(result.current.isLiveLocationStopped).toBe(true);
  });
});
