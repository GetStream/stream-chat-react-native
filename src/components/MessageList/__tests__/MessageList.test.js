import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import {
  dispatchMessageNewEvent,
  dispatchTypingEvent,
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
import { ChatContext } from '../../../context';
import { act } from 'react-test-renderer';

describe('MessageList', () => {
  afterEach(cleanup);

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannel({
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user2 }),
      ],
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByText, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    const newMessage = generateMessage({ user: user2 });
    dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel);

    await waitFor(() => {
      expect(queryAllByTestId('message-notification')).toHaveLength(0);
      expect(getByText(newMessage.text)).toBeTruthy();
    });
  });

  it('should render a system message in the list', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ user: undefined, type: 'system' }),
        generateMessage({ user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(queryAllByTestId('typing-indicator')).toHaveLength(0);
      expect(getByTestId('message-system')).toBeTruthy();
    });
  });

  it('should render the typing indicator when typing object is non empty', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    dispatchTypingEvent(chatClient, user1, mockedChannel.channel);

    await waitFor(() => {
      expect(queryAllByTestId('message-system')).toHaveLength(0);
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(getByTestId('typing-indicator')).toBeTruthy();
    });
  });

  it('should render the is offline error', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId, getByText, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <ChatContext.Consumer>
          {(context) => (
            <ChatContext.Provider value={{ ...context, isOnline: false }}>
              <Channel channel={channel}>
                <MessageList />
              </Channel>
            </ChatContext.Provider>
          )}
        </ChatContext.Consumer>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('message-system')).toHaveLength(0);
      expect(queryAllByTestId('typing-indicator')).toHaveLength(0);
      expect(getByTestId('error-notification')).toBeTruthy();
      expect(
        getByText('Connection failure, reconnecting now ...'),
      ).toBeTruthy();
    });
  });

  it('should render MessageNotification when new message is received and user has scroll up in list, then remove MessageNotification on scroll down', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const messages = new Array(50).fill(generateMessage({ user: user1 }));
    const mockedChannel = generateChannel({
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user2 }),
      ],
      messages,
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-flat-list')).toBeTruthy();
      expect(queryAllByTestId('message-notification')).toHaveLength(0);
    });

    const eventDataUp = {
      nativeEvent: {
        contentOffset: {
          y: 500,
        },
        contentSize: {
          // Dimensions of the scrollable content
          height: 500,
          width: 100,
        },
        layoutMeasurement: {
          // Dimensions of the device
          height: 100,
          width: 100,
        },
      },
    };
    fireEvent.scroll(getByTestId('message-flat-list'), eventDataUp);

    act(() => {
      const newMessage = generateMessage({ user: user2 });
      dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel);
    });

    await waitFor(() => {
      expect(getByTestId('message-notification')).toBeTruthy();
    });

    const eventDataDown = {
      nativeEvent: {
        contentOffset: {
          y: 0,
        },
        contentSize: {
          // Dimensions of the scrollable content
          height: 500,
          width: 100,
        },
        layoutMeasurement: {
          // Dimensions of the device
          height: 100,
          width: 100,
        },
      },
    };
    fireEvent.scroll(getByTestId('message-flat-list'), eventDataDown);

    await waitFor(() => {
      expect(queryAllByTestId('message-notification')).toHaveLength(0);
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
          '2020-05-06T14:50:00.000Z',
        ),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { queryAllByTestId, toJSON } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('date-separator')).toHaveLength(2);
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
