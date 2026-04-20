import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import truncate from 'lodash/truncate';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelPreviewView } from '../ChannelPreviewView';

describe('ChannelPreviewView', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat;
  let channel: ChannelType | null;

  const getComponent = (props: Partial<React.ComponentProps<typeof ChannelPreviewView>> = {}) => (
    <Chat client={chatClient}>
      <ChannelPreviewView
        {...({
          channel,
          client: chatClient,
          latestMessagePreview: {
            created_at: '',
            messageObject: generateMessage(),
            previews: [
              {
                bold: true,
                text: 'This is the message preview text',
              },
            ],
            status: 1, // read states of latest message.
          },
          onSelect: jest.fn(),
        } as unknown as React.ComponentProps<typeof ChannelPreviewView>)}
        {...props}
      />
    </Chat>
  );

  const initializeChannel = async (c: ReturnType<typeof generateChannelResponse>) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  it('should call setActiveChannel on click', async () => {
    const onSelect = jest.fn();
    await initializeChannel(generateChannelResponse());

    render(
      getComponent({
        onSelect,
        ...({ watchers: {} } as unknown as Partial<
          React.ComponentProps<typeof ChannelPreviewView>
        >),
      }),
    );

    await waitFor(() => screen.getByTestId('channel-preview-button'));

    fireEvent(screen.getByTestId('channel-preview-button'), 'onPress');

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  it('should render name of channel', async () => {
    const channelName = Date.now().toString();
    await initializeChannel(
      generateChannelResponse({
        channel: {
          name: channelName,
        },
      }),
    );
    render(getComponent());
    await waitFor(() => screen.queryByText(channelName));
  });

  it('should render comma separated names of other members, if channel has no name', async () => {
    const m1 = generateMember();
    const m2 = generateMember();
    const m3 = generateMember();

    await initializeChannel(
      generateChannelResponse({
        members: [m1, m2, m3],
      }),
    );

    render(getComponent());
    const expectedDisplayName = `${m1.user!.name}, ${m2.user!.name}, ${m3.user!.name}`;

    await waitFor(() => screen.queryByText(expectedDisplayName));
  });

  it('should render latest message, truncated to length given by latestMessageLength', async () => {
    const message = generateMessage();
    await initializeChannel(generateChannelResponse());

    render(
      getComponent({
        ...({
          latestMessage: message,
          latestMessageLength: 6,
        } as unknown as Partial<React.ComponentProps<typeof ChannelPreviewView>>),
      }),
    );

    const expectedMessagePreview = truncate(message.text, { length: 6 });
    await waitFor(() => screen.queryByText(expectedMessagePreview));
  });
});
