import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import truncate from 'lodash/truncate';

import { ChannelPreviewMessenger } from '../ChannelPreviewMessenger';

import { Chat } from '../../Chat/Chat';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <ChannelPreviewMessenger
        channel={channel}
        client={chatClient}
        latestMessagePreview={generateMessage()}
        setActiveChannel={jest.fn()}
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
    const setActiveChannel = jest.fn();
    await initializeChannel(generateChannel());

    const { getByTestId } = render(
      getComponent({
        setActiveChannel,
        watchers: {},
      }),
    );

    await waitFor(() => getByTestId('channel-preview-button'));
    fireEvent.press(getByTestId('channel-preview-button'));

    await waitFor(() => {
      // eslint-disable-next-line jest/prefer-called-with
      expect(setActiveChannel).toHaveBeenCalledTimes(1);
    });
  });

  it('should render name of channel', async () => {
    const channelName = Date.now().toString();
    await initializeChannel(
      generateChannel({
        channel: {
          name: channelName,
        },
      }),
    );
    const { queryByText } = render(getComponent());
    await waitFor(() => queryByText(channelName));
  });

  it('should render comma separated names of other members, if channel has no name', async () => {
    const m1 = generateMember();
    const m2 = generateMember();
    const m3 = generateMember();

    await initializeChannel(
      generateChannel({
        members: [m1, m2, m3],
      }),
    );

    const { queryByText } = render(getComponent());
    const expectedDisplayName = `${m1.user.name}, ${m2.user.name}, ${m3.user.name}`;

    await waitFor(() => queryByText(expectedDisplayName));
  });

  it('should render latest message, truncated to length given by latestMessageLength', async () => {
    const message = generateMessage();
    await initializeChannel(generateChannel());

    const { queryByText } = render(
      getComponent({
        latestMessage: message,
        latestMessageLength: 6,
      }),
    );

    const expectedMessagePreview = truncate(message.text, { length: 6 });
    await waitFor(() => queryByText(expectedMessagePreview));
  });
});
