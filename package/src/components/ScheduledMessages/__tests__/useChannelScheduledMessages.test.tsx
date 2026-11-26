import React, { PropsWithChildren } from 'react';

import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { Channel, StreamChat } from 'stream-chat';

import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { useChannelScheduledMessages } from '../hooks/useChannelScheduledMessages';

describe('useChannelScheduledMessages', () => {
  let client: StreamChat;
  let channel: Channel;

  const wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>{children}</ChatProvider>
  );

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('loads the list only once the channel is initialized, and again when capabilities change', () => {
    const ensureSpy = jest
      .spyOn(channel, 'ensureScheduledMessagesLoaded')
      .mockImplementation(() => undefined);
    act(() => {
      channel.state.partialNext({ initialized: false });
    });

    renderHook(() => useChannelScheduledMessages(channel.scheduledMessages), { wrapper });
    expect(ensureSpy).not.toHaveBeenCalled();

    act(() => {
      channel.state.partialNext({ initialized: true });
    });
    expect(ensureSpy).toHaveBeenCalledTimes(1);

    act(() => {
      channel.state.partialNext({ ownCapabilities: ['schedule-message'] });
    });
    expect(ensureSpy).toHaveBeenCalledTimes(2);
  });
});
