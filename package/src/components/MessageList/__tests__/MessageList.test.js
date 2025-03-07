import React from 'react';

import { FlatList } from 'react-native';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

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
import { Channel } from '../../Channel/Channel';
import { channelInitialState } from '../../Channel/hooks/useChannelDataState';
import * as MessageListPaginationHook from '../../Channel/hooks/useMessageListPagination';
import { Chat } from '../../Chat/Chat';

import { MessageList } from '../MessageList';

describe('MessageList', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

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
      expect(queryAllByTestId('scroll-to-bottom-button')).toHaveLength(0);
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

    const { getByTestId } = render(
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

    const { getByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
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

    const { getByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} deletedMessagesVisibilityType='sender'>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
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

    const { getByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} deletedMessagesVisibilityType='receiver'>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
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

    const { queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} deletedMessagesVisibilityType='never'>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
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
  });

  it('should scroll to a message even if out of the loaded window', async () => {
    const user1 = generateUser();

    const mockedLongMessagesList = [];
    // we need a long enough list to make sure elements aren't preloaded by the underlying FlatList
    for (let i = 0; i <= 150; i += 1) {
      mockedLongMessagesList.push(generateMessage({ timestamp: new Date(), user: user1 }));
    }
    // could be any message that is not within the initially processed ones
    const latestMessageText = mockedLongMessagesList[0].text;
    const { id: targetedMessageId, text: targetedMessageText } =
      mockedLongMessagesList[mockedLongMessagesList.length - 4];

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

  it("should render the UnreadMessagesIndicator when there's unread messages", async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const messages = Array.from({ length: 10 }, (_, i) =>
      generateMessage({ id: `${i}`, text: `message-${i}` }),
    );
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
    });

    const chatClient = await getTestClientWithUser({ id: user1.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const channelUnreadState = {
      last_read: new Date(),
      last_read_message_id: '5',
      unread_messages: 5,
    };

    channel.state = {
      ...channelInitialState,
      latestMessages: [],
      messages,
    };

    const { queryByLabelText } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList channelUnreadState={channelUnreadState} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryByLabelText('Inline unread indicator')).toBeTruthy();
    });
  });

  it("should not render the UnreadMessagesIndicator when there's no unread messages", async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const messages = Array.from({ length: 10 }, (_, i) =>
      generateMessage({ id: `${i}`, text: `message-${i}` }),
    );
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
    });

    const chatClient = await getTestClientWithUser({ id: user1.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const channelUnreadState = {
      last_read: new Date(),
      unread_messages: 0,
    };

    channel.state = {
      ...channelInitialState,
      latestMessages: [],
      messages,
    };

    const { queryByLabelText } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList channelUnreadState={channelUnreadState} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryByLabelText('Inline unread indicator')).not.toBeTruthy();
    });
  });

  it('should call markRead function when message.new event is dispatched and new messages are received', async () => {
    const user = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user })],
    });

    const chatClient = await getTestClientWithUser({ id: user.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const user2 = generateUser();
    const newMessage = generateMessage({ user: user2 });

    const markReadFn = jest.fn();

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList markRead={markReadFn} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel));

    await waitFor(() => {
      expect(markReadFn).toHaveBeenCalledTimes(1);
    });
  });

  it("should scroll to the targeted message if it's present in the list", async () => {
    const user = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user })],
    });

    const messages = Array.from({ length: 30 }, (_, i) =>
      generateMessage({ id: `${i}`, text: `message-${i}` }),
    );

    const chatClient = await getTestClientWithUser({ id: user.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const targetedMessage = messages[15].id;

    channel.state = {
      ...channelInitialState,
      latestMessages: [],
      messages,
    };

    const flatListRefMock = jest
      .spyOn(FlatList.prototype, 'scrollToIndex')
      .mockImplementation(() => {});

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList targetedMessage={targetedMessage} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(flatListRefMock).toHaveBeenCalledWith({
        animated: true,
        index: 14,
        viewPosition: 0.5,
      });
    });
  });

  it("should load more messages around the message id if the targeted message isn't present in the list", async () => {
    const user = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user })],
    });

    const messages = Array.from({ length: 20 }, (_, i) =>
      generateMessage({ id: `${i}`, text: `message-${i}` }),
    );

    const chatClient = await getTestClientWithUser({ id: user.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const targetedMessage = 21;
    const setTargetedMessage = jest.fn();

    channel.state = {
      ...channelInitialState,
      latestMessages: [],
      messages,
    };

    const loadChannelAroundMessage = jest.fn(() => Promise.resolve());

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList
              loadChannelAroundMessage={loadChannelAroundMessage}
              setTargetedMessage={setTargetedMessage}
              targetedMessage={targetedMessage}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(loadChannelAroundMessage).toHaveBeenCalledWith({
        messageId: targetedMessage,
        setTargetedMessage,
      });
    });
  });
});

describe('MessageList pagination', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const mockedHook = (values) => {
    const messages = Array.from({ length: 100 }, (_, i) =>
      generateMessage({ text: `message-${i}` }),
    );
    return jest
      .spyOn(MessageListPaginationHook, 'useMessageListPagination')
      .mockImplementation(() => ({
        copyMessagesStateFromChannel: jest.fn(),
        loadChannelAroundMessage: jest.fn(),
        loadChannelAtFirstUnreadMessage: jest.fn(),
        loadInitialMessagesStateFromChannel: jest.fn(),
        loadLatestMessages: jest.fn(),
        loadMore: jest.fn(),
        loadMoreRecent: jest.fn(),
        state: { ...channelInitialState, messages },
        ...values,
      }));
  };

  it('should load more recent messages when the user scrolls to the start of the list', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: Array.from({ length: 100 }, (_, i) => generateMessage({ text: `message-${i}` })),
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const loadMoreRecent = jest.fn(() => Promise.resolve());
    mockedHook({ loadMoreRecent });

    const { getByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    act(() => {
      // scroll to the top of the list
      const flatList = getByTestId('message-flat-list');
      fireEvent(flatList, 'momentumScrollEnd', {
        nativeEvent: {
          contentOffset: { y: 0 }, // Scroll position at the top
          contentSize: { height: 2000, width: 200 }, // Total content size
          layoutMeasurement: { height: 400, width: 200 }, // Visible area size
        },
      });
    });

    await waitFor(() => {
      expect(loadMoreRecent).toHaveBeenCalledTimes(1);
    });
  });

  it('should load more messages when the user scrolls to the end of the list', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: Array.from({ length: 100 }, (_, i) => generateMessage({ text: `message-${i}` })),
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const loadMore = jest.fn(() => Promise.resolve());
    mockedHook({ loadMore });

    const { getByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    act(() => {
      // scroll to the top of the list
      const flatList = getByTestId('message-flat-list');
      fireEvent(flatList, 'momentumScrollEnd', {
        nativeEvent: {
          contentOffset: { y: 1900 }, // Scroll position at the top
          contentSize: { height: 2000, width: 200 }, // Total content size
          layoutMeasurement: { height: 400, width: 200 }, // Visible area size
        },
      });
    });

    await waitFor(() => {
      expect(loadMore).toHaveBeenCalledTimes(1);
    });
  });

  it('should call load latest messages when the scroll to bottom button is pressed', async () => {
    const user1 = generateUser();
    const messages = Array.from({ length: 10 }, (_, i) =>
      generateMessage({ text: `message-${i}` }),
    );
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages,
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    channel.state = {
      ...channelInitialState,
      latestMessages: [],
      members: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i, generateMember({ id: i })]),
      ),
      messages: Array.from({ length: 10 }, (_, i) => generateMessage({ id: i })),
      messageSets: [{ isCurrent: true, isLatest: true }],
    };

    const loadLatestMessages = jest.fn(() => Promise.resolve());
    mockedHook({ loadLatestMessages });

    const { getByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    act(() => {
      // scroll to the top of the list
      const flatList = getByTestId('message-flat-list');
      fireEvent(flatList, 'scroll', {
        nativeEvent: {
          contentOffset: { y: 1900 }, // Scroll position at the top
          contentSize: { height: 2000, width: 200 }, // Total content size
          layoutMeasurement: { height: 400, width: 200 }, // Visible area size
        },
      });
    });

    await waitFor(() => {
      const scrollToBottomButton = getByTestId('scroll-to-bottom-button');
      expect(scrollToBottomButton).toBeTruthy();

      fireEvent.press(scrollToBottomButton);

      expect(loadLatestMessages).toHaveBeenCalledTimes(1);
    });
  });
});
