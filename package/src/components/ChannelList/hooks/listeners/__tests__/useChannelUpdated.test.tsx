import React, { useState } from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import type { Channel, ChannelResponse, Event, StreamChat } from 'stream-chat';
import { ChatContext, useChannelUpdated } from '../../../../../index';
import { act } from 'react-test-renderer';

describe('useChannelUpdated', () => {
  it("defaults to the channels own_capabilities if the event doesn't include it", async () => {
    let eventHanler: (event: Event) => any;
    const mockChannel = {
      cid: 'channeltype:123abc',
      data: {
        own_capabilities: {
          send_messages: true,
        },
      },
    } as Channel;

    const mockEvent = {
      channel: {
        cid: mockChannel.cid,
      } as ChannelResponse,
      type: 'channel.updated' as Event['type'],
    };

    const mockClient = {
      on: jest.fn().mockImplementation((_eventName: string, handler: (event: Event) => any) => {
        eventHanler = handler;
      }),
      off: jest.fn(),
    } as unknown as StreamChat;

    const TestComponent = () => {
      const [channels, setChannels] = useState<Channel[]>([mockChannel]);

      useChannelUpdated({ setChannels });

      if (
        channels[0].data?.own_capabilities &&
        Object.keys(channels[0].data?.own_capabilities as any).includes('send_messages')
      ) {
        return <Text>Send messages enabled</Text>;
      }

      return <Text>Send messages NOT enabled</Text>;
    };

    const { getByText } = await waitFor(() =>
      render(
        <ChatContext.Provider
          value={{
            client: mockClient,
            connectionRecovering: false,
            isOnline: true,
            mutedUsers: [],
            setActiveChannel: () => null,
          }}
        >
          <TestComponent />
        </ChatContext.Provider>,
      ),
    );

    await waitFor(() => {
      expect(getByText('Send messages enabled')).toBeTruthy();
    });

    act(() => {
      eventHanler(mockEvent);
    });

    await waitFor(() => {
      expect(getByText('Send messages enabled')).toBeTruthy();
    });
  });
});
