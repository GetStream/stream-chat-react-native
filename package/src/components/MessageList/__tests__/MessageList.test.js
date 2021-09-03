import React from 'react';
import { View } from 'react-native';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { MessageList } from '../MessageList';

import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';

import { ChatContext, ChatProvider } from '../../../contexts/chatContext/ChatContext';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchTypingEvent from '../../../mock-builders/event/typing';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage, generateStaticMessage } from '../../../mock-builders/generator/message';
import { generateStaticUser, generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { ImageGalleryProvider } from '../../../contexts/imageGalleryContext/ImageGalleryContext';

function MockedFlatList(props) {
  if (!props.data.length && props.ListEmptyComponent) return props.ListEmptyComponent();

  const items = props.data.map((item, index) => {
    const key = props.keyExtractor(item, index);
    return <View key={key}>{props.renderItem({ index, item })}</View>;
  });
  return <View testID={props.testID}>{items}</View>;
}

describe('MessageList', () => {
  afterEach(cleanup);

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
      messages: [generateMessage({ user: user1 }), generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();
    channel.initialized = true;

    const { getByText, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <ImageGalleryProvider>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <MessageList />
          </Channel>
        </ImageGalleryProvider>
      </Chat>,
    );

    const newMessage = generateMessage({ user: user2 });
    dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel);

    await waitFor(() => {
      expect(queryAllByTestId('message-notification')).toHaveLength(0);
      expect(getByText(newMessage.text)).toBeTruthy();
    });
  }, 10000);

  it('should render a system message in the list', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <ChatContext.Consumer>
          {(context) => (
            <ChatProvider value={{ ...context, isOnline: true }}>
              <ImageGalleryProvider>
                <Channel channel={channel} FlatList={MockedFlatList}>
                  <MessageList />
                </Channel>
              </ImageGalleryProvider>
            </ChatProvider>
          )}
        </ChatContext.Consumer>
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
        <ChatContext.Consumer>
          {(context) => (
            <ChatProvider value={{ ...context, isOnline: true }}>
              <ImageGalleryProvider>
                <Channel channel={channel} FlatList={MockedFlatList}>
                  <MessageList />
                </Channel>
              </ImageGalleryProvider>
            </ChatProvider>
          )}
        </ChatContext.Consumer>
      </Chat>,
    );

    dispatchTypingEvent(chatClient, user1, mockedChannel.channel);

    await waitFor(() => {
      expect(queryAllByTestId('message-system')).toHaveLength(0);
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(getByTestId('typing-indicator')).toBeTruthy();
    });
  });

  it('should render the EmptyStateIndicator when no messages loaded', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 })],
      messages: [],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ImageGalleryProvider>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <MessageList />
          </Channel>
        </ImageGalleryProvider>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
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
            <ChatProvider value={{ ...context, isOnline: false }}>
              <ImageGalleryProvider>
                <Channel channel={channel}>
                  <MessageList />
                </Channel>
              </ImageGalleryProvider>
            </ChatProvider>
          )}
        </ChatContext.Consumer>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('message-system')).toHaveLength(0);
      expect(queryAllByTestId('typing-indicator')).toHaveLength(0);
      expect(getByTestId('error-notification')).toBeTruthy();
      expect(getByText('Reconnecting...')).toBeTruthy();
    });
  });

  it('should render the message list and match snapshot', async () => {
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(2);
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 }), generateMember({ user: user1 })],
      messages: [
        generateStaticMessage('Message1', { user: user1 }, '2020-05-05T14:48:00.000Z'),
        generateStaticMessage('Message2', { user: user2 }, '2020-05-05T14:49:00.000Z'),
        generateStaticMessage('Message3', { user: user2 }, '2020-05-06T14:50:00.000Z'),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { queryAllByTestId, toJSON } = render(
      <Chat client={chatClient}>
        <ImageGalleryProvider>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <MessageList />
          </Channel>
        </ImageGalleryProvider>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('date-separator')).toHaveLength(2);
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
