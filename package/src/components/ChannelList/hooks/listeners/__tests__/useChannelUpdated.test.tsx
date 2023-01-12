import React, { useState } from 'react';
import { Image, Text } from 'react-native';

import { act } from 'react-test-renderer';

import { render, waitFor } from '@testing-library/react-native';
import type { Channel, ChannelResponse, Event, StreamChat } from 'stream-chat';

import { ChatContext, useChannelUpdated } from '../../../../../index';

describe('useChannelUpdated', () => {
  it("defaults to the channels own_capabilities if the event doesn't include it", async () => {
    let eventHanler: (event: Event) => void;
    const mockChannel = {
      cid: 'channeltype:123abc',
      data: {
        own_capabilities: {
          send_messages: true,
        },
      },
    } as unknown as Channel;

    const mockEvent = {
      channel: {
        cid: mockChannel.cid,
      } as ChannelResponse,
      type: 'channel.updated' as Event['type'],
    };

    const mockClient = {
      off: jest.fn(),
      on: jest.fn().mockImplementation((_eventName: string, handler: (event: Event) => void) => {
        eventHanler = handler;
      }),
    } as unknown as StreamChat;

    const TestComponent = () => {
      const [channels, setChannels] = useState<Channel[] | null>([mockChannel]);

      useChannelUpdated({ setChannels });

      if (
        channels &&
        channels[0].data?.own_capabilities &&
        Object.keys(channels[0].data?.own_capabilities as { [key: string]: boolean }).includes(
          'send_messages',
        )
      ) {
        return <Text>Send messages enabled</Text>;
      }

      return <Text>Send messages NOT enabled</Text>;
    };

    const { getByText } = await waitFor(() =>
      render(
        <ChatContext.Provider
          value={{
            appSettings: null,
            client: mockClient,
            connectionRecovering: false,
            enableOfflineSupport: false,
            ImageComponent: Image,
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
