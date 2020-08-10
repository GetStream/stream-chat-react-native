import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import {
  useMockedApis,
  getOrCreateChannelApi,
  generateChannel,
  generateMessage,
  generateStaticMessage,
  generateMember,
  generateStaticUser,
  generateUser,
  dispatchMessageNewEvent,
  getTestClientWithUser,
} from 'mock-builders';

import { Chat } from '../../Chat';
import MessageList from '../MessageList';
import { Channel } from '../../Channel';

describe('MessageList', () => {
  afterEach(cleanup);

  let chatClient;

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannel({
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ user: user1 }),
      ],
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user1 }),
      ],
    });

    chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByText } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    const newMessage = generateMessage({ user: user2 });
    dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel);

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeTruthy();
    });
  });

  it('should render the message list', async () => {
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(2);
    const mockedChannel = generateChannel({
      messages: [
        generateStaticMessage(
          'Message1',
          { user: user1 },
          '2020-05-05T14:48:00',
        ),
        generateStaticMessage(
          'Message2',
          { user: user2 },
          '2020-05-05T14:49:00',
        ),
        generateStaticMessage(
          'Message3',
          { user: user2 },
          '2020-05-05T14:50:00',
        ),
      ],
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user1 }),
      ],
    });

    chatClient = await getTestClientWithUser({ id: 'testID2' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { toJSON } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
