import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import {
  dispatchMessageNewEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateStaticMessage,
  generateStaticUser,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import MessageList from '../MessageList';

describe('MessageList', () => {
  afterEach(cleanup);

  let chatClient;

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannel({
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user1 }),
      ],
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ user: user1 }),
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

  it('should render the message list and match snapshot', async () => {
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(2);
    const mockedChannel = generateChannel({
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user1 }),
      ],
      messages: [
        generateStaticMessage(
          'Message1',
          { user: user1 },
          '2020-05-05T14:48:00.000Z',
        ),
        generateStaticMessage(
          'Message2',
          { user: user2 },
          '2020-05-05T14:49:00.000Z',
        ),
        generateStaticMessage(
          'Message3',
          { user: user2 },
          '2020-05-05T14:50:00.000Z',
        ),
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
