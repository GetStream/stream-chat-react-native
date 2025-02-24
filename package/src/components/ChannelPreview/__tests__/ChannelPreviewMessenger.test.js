import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import truncate from 'lodash/truncate';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelPreviewMessenger } from '../ChannelPreviewMessenger';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <ChannelPreviewMessenger
        channel={channel}
        client={chatClient}
        latestMessagePreview={{
          created_at: '',
          messageObject: generateMessage(),
          previews: [
            {
              bold: true,
              text: 'This is the message preview text',
            },
          ],
          status: 1, // read states of latest message.
        }}
        onSelect={jest.fn()}
        {...props}
      />
    </Chat>
  );

  const initializeChannel = async (c) => {
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
        watchers: {},
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
    const expectedDisplayName = `${m1.user.name}, ${m2.user.name}, ${m3.user.name}`;

    await waitFor(() => screen.queryByText(expectedDisplayName));
  });

  it('should render latest message, truncated to length given by latestMessageLength', async () => {
    const message = generateMessage();
    await initializeChannel(generateChannelResponse());

    render(
      getComponent({
        latestMessage: message,
        latestMessageLength: 6,
      }),
    );

    const expectedMessagePreview = truncate(message.text, { length: 6 });
    await waitFor(() => screen.queryByText(expectedMessagePreview));
  });
});
