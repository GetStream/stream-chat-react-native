import React from 'react';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';

import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchTypingEvent from '../../../mock-builders/event/typing';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { registerNativeHandlers } from '../../../native';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageList } from '../MessageList';

describe('MessageList', () => {
  afterEach(cleanup);

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
      messages: [generateMessage({ user: user1 }), generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByText, queryAllByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    const newMessage = generateMessage({ user: user2 });
    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel));

    await waitFor(() => {
      expect(queryAllByTestId('message-notification')).toHaveLength(0);
      expect(getByText(newMessage.text)).toBeTruthy();
    });
  }, 10000);

  it('should render a system message in the list', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
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
    await channel.watch();

    const { getByTestId, queryAllByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    // debug()
    await waitFor(() => {
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(getByTestId('message-system')).toBeTruthy();
    });
  });

  it('should render deleted message in the list when `deleteMessagesVisibilityType` is set to default(always)', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ type: 'deleted', user: user1 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId, queryAllByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(getByTestId('message-deleted')).toBeTruthy();
      expect(queryByTestId('only-visible-to-you')).toBeNull();
    });
  });

  it('should render deleted message in the list when `deleteMessagesVisibilityType` is set to sender', async () => {
    const user1 = generateUser();
    const user2 = generateUser({ id: 'testID' });
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ type: 'deleted', user: user2 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId, queryAllByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} deletedMessagesVisibilityType='sender'>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(queryByTestId('message-deleted')).toBeTruthy();
      expect(getByTestId('only-visible-to-you')).toBeTruthy();
    });
  });

  it('should render deleted message in the list when `deleteMessagesVisibilityType` is set to receiver', async () => {
    const user1 = generateUser();
    const user2 = generateUser({ id: 'testID' });
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ user: user2 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ type: 'deleted', user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId, queryAllByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} deletedMessagesVisibilityType='receiver'>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(getByTestId('message-deleted')).toBeTruthy();
      expect(queryByTestId('only-visible-to-you')).toBeNull();
    });
  });

  it('should render deleted message in the list when `deleteMessagesVisibilityType` is set to never', async () => {
    const user1 = generateUser();
    const user2 = generateUser({ id: 'testID' });
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ user: user2 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ type: 'deleted', user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { queryAllByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} deletedMessagesVisibilityType='never'>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(queryByTestId('message-deleted')).toBeNull();
      expect(queryByTestId('only-visible-to-you')).toBeNull();
    });
  });

  it('should render deleted message in the list', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ type: 'deleted', user: user1 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId, queryAllByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(getByTestId('message-deleted')).toBeTruthy();
    });
  });

  it('should render the typing indicator when typing object is non empty', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId, queryAllByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    act(() => {
      dispatchTypingEvent(chatClient, user1, mockedChannel.channel);
    });

    await waitFor(() => {
      expect(queryAllByTestId('message-system')).toHaveLength(0);
      expect(queryAllByTestId('error-notification')).toHaveLength(0);
      expect(getByTestId('typing-indicator')).toBeTruthy();
    });
  });

  it('should render the EmptyStateIndicator when no messages loaded', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  it('should render the is offline error', async () => {
    registerNativeHandlers({
      NetInfo: {
        addEventListener: () => () => null,
        fetch: () =>
          new Promise((resolve) => {
            resolve(false);
          }),
      },
    });

    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId, getByText, queryAllByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('message-system')).toHaveLength(0);
      expect(queryAllByTestId('typing-indicator')).toHaveLength(0);
      expect(getByTestId('error-notification')).toBeTruthy();
      expect(getByText('Reconnecting...')).toBeTruthy();
    });

    registerNativeHandlers({
      NetInfo: {
        addEventListener: () => () => null,
        fetch: () =>
          new Promise((resolve) => {
            resolve(true);
          }),
      },
    });
  });

  it('should scroll to a message even if out of the loaded window', async () => {
    const user1 = generateUser();

    const mockedLongMessagesList = [];
    // we need a long enough list to make sure elements aren't preloaded by the underlying FlatList
    for (let i = 0; i <= 150; i += 1) {
      mockedLongMessagesList.push(generateMessage({ timestamp: new Date(), user: user1 }));
    }
    // could be any message that is not within the initially processed ones
    const { id: targetedMessageId, text: targetedMessageText } = mockedLongMessagesList[3];
    const latestMessageText = mockedLongMessagesList[mockedLongMessagesList.length - 1].text;

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: mockedLongMessagesList,
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList targetedMessage={targetedMessageId} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(targetedMessageText)).toBeOnTheScreen();
      expect(() => screen.getByText(latestMessageText)).toThrow();
    });
  });
});
