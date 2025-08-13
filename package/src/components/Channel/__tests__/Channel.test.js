import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';

import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react-native';
import { StreamChat } from 'stream-chat';

import { ChannelContext, ChannelProvider } from '../../../contexts/channelContext/ChannelContext';
import { ChannelsStateProvider } from '../../../contexts/channelsStateContext/ChannelsStateContext';
import {
  MessagesContext,
  MessagesProvider,
} from '../../../contexts/messagesContext/MessagesContext';

import { ThreadContext, ThreadProvider } from '../../../contexts/threadContext/ThreadContext';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchConnectionChanged from '../../../mock-builders/event/connectionChanged';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Attachment } from '../../Attachment/Attachment';
import { Chat } from '../../Chat/Chat';
import { Channel } from '../Channel';
import {
  channelInitialState,
  useChannelDataState,
  useChannelMessageDataState,
} from '../hooks/useChannelDataState';
import * as MessageListPaginationHooks from '../hooks/useMessageListPagination';

// This component is used for performing effects in a component that consumes ChannelContext,
// i.e. making use of the callbacks & values provided by the Channel component.
// the effect is called every time channelContext changes
const CallbackEffectWithContext = ({ callback, context }) => {
  const ctx = useContext(context);
  useEffect(() => {
    callback(ctx);
  }, [callback, ctx]);

  return <View />;
};

const ContextConsumer = ({ context, fn }) => {
  fn(useContext(context));
  return <View testID='children' />;
};

const channelType = 'messaging';
const channelId = 'test-channel';
const channelCid = `${channelType}:${channelId}`;
let chatClient;
let channel;

const user = generateUser({ id: 'id', name: 'name' });
const messages = [generateMessage({ cid: channelCid, user })];

const renderComponent = (props = {}, callback = () => {}, context = ChannelContext) =>
  render(
    <ChannelsStateProvider>
      <Chat client={chatClient}>
        <Channel {...props}>
          {props.children}
          <CallbackEffectWithContext {...{ callback, context }} />
        </Channel>
      </Chat>
    </ChannelsStateProvider>,
  );

describe('Channel', () => {
  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannelResponse({
      cid: channelCid,
      id: channelId,
      members,
      messages,
      type: channelType,
    });
    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
    channel.cid = mockedChannel.channel.cid;
    const getConfigSpy = jest.fn();
    channel.getConfig = getConfigSpy;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render a simple text error if the channel id does not exist', async () => {
    const nullChannel = {
      ...channel,
      cid: null,
      countUnread: () => 0,
      off: () => {},
      on: () => ({
        unsubscribe: () => null,
      }),
      watch: () => {},
    };
    const { getByTestId } = renderComponent({ channel: nullChannel });

    await waitFor(() => {
      expect(getByTestId('no-channel')).toBeTruthy();
    });
  });

  it('should watch the current channel on mount', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');
    renderComponent({ channel });

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it('should set an error if channel watch fails and render a LoadingErrorIndicator', async () => {
    const watchError = new Error('channel watch fail');
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => Promise.reject(watchError));

    const { getByTestId } = renderComponent({ channel });

    await waitFor(() => expect(getByTestId('loading-error')).toBeTruthy());
  });

  it('should render children if a channel is set', async () => {
    const { getByTestId } = renderComponent({
      channel,
      children: <View testID='children' />,
    });

    await waitFor(() => expect(getByTestId('children')).toBeTruthy());
  });

  it('should add a connection recovery handler to the client on mount', async () => {
    const clientOnSpy = jest.spyOn(chatClient, 'on');
    renderComponent({ channel });

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith('connection.recovered', expect.any(Function)),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const channelOnSpy = jest.spyOn(channel, 'on');
    renderComponent({ channel });

    await waitFor(() => expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)));
  });

  it('should be able to open threads', async () => {
    const threadMessage = messages[0];
    const hasThread = jest.fn();
    // this renders Channel, calls openThread from a child context consumer with a message,
    // and then calls hasThread with the thread id if it was set.
    const { rerender } = renderComponent(
      { channel },
      ({ openThread, thread }) => {
        if (!thread) {
          openThread(threadMessage);
        } else {
          hasThread(thread.id);
        }
      },
      ThreadContext,
    );

    rerender(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <CallbackEffectWithContext
              callback={({ openThread, thread }) => {
                if (!thread) {
                  openThread(threadMessage);
                } else {
                  hasThread(thread.id);
                }
              }}
              context={ThreadContext}
            />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );
    await waitFor(() => expect(hasThread).toHaveBeenCalledWith(threadMessage.id));
  });

  const queryChannelWithNewMessages = (newMessages) =>
    // generate new channel mock from existing channel with new messages added
    getOrCreateChannelApi(
      generateChannelResponse({
        channel: {
          config: channel.getConfig(),
          id: channel.id,
          type: channel.type,
        },
        messages: newMessages,
      }),
    );

  it('should call the channel query method to load more messages', async () => {
    const channelQuerySpy = jest.spyOn(channel, 'query');

    const newMessages = [generateMessage()];

    renderComponent(
      { channel },
      () => {
        useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
      },
      MessagesContext,
    );

    await waitFor(() => expect(channelQuerySpy).toHaveBeenCalled());
  });

  describe('ChannelContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ChannelProvider>
          <View testID='children' />
        </ChannelProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the channel context', async () => {
      let context;

      const mockContext = {
        channel,
        client: chatClient,
        markRead: () => {},
        watcherCount: 5,
      };

      render(
        <ChannelProvider value={mockContext}>
          <ContextConsumer
            context={ChannelContext}
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </ChannelProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.channel).toBeInstanceOf(Object);
        expect(context.client).toBeInstanceOf(StreamChat);
        expect(context.markRead).toBeInstanceOf(Function);
        expect(context.watcherCount).toBe(5);
      });
    });
  });

  describe('MessagesContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <MessagesProvider>
          <View testID='children' />
        </MessagesProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the messages context', async () => {
      let context;

      const mockContext = {
        Attachment,
        editing: false,
        messages,
        sendMessage: () => {},
      };

      render(
        <MessagesProvider value={mockContext}>
          <ContextConsumer
            context={MessagesContext}
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </MessagesProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.Attachment).toBeInstanceOf(Function);
        expect(context.editing).toBe(false);
        expect(context.messages).toBeInstanceOf(Array);
        expect(context.sendMessage).toBeInstanceOf(Function);
      });
    });
  });

  describe('ThreadContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ThreadProvider>
          <View testID='children' />
        </ThreadProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the thread context', async () => {
      let context;

      const mockContext = {
        openThread: () => {},
        thread: {},
        threadHasMore: true,
        threadLoadingMore: false,
      };

      render(
        <ThreadProvider value={mockContext}>
          <ContextConsumer
            context={ThreadContext}
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </ThreadProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.openThread).toBeInstanceOf(Function);
        expect(context.thread).toBeInstanceOf(Object);
        expect(context.threadHasMore).toBe(true);
        expect(context.threadLoadingMore).toBe(false);
      });
    });
  });
});

describe('Channel initial load useEffect', () => {
  let chatClient;

  const renderComponent = (props = {}) =>
    render(
      <Chat client={chatClient}>
        <Channel {...props}>{props.children}</Channel>
      </Chat>,
    );

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(user);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should still call channel.watch if we are online and DB channels are loaded', async () => {
    const messages = Array.from({ length: 10 }, (_, i) => generateMessage({ id: i }));
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();
    channel.offlineMode = true;
    channel.state = {
      ...channelInitialState,
      messagePagination: {
        hasPrev: true,
      },
    };
    const watchSpy = jest.fn();
    channel.watch = watchSpy;

    renderComponent({ channel });

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it("should call channel.watch if channel is initialized and it's not in offline mode", async () => {
    const messages = Array.from({ length: 10 }, (_, i) => generateMessage({ id: i }));
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    channel.state = {
      ...channelInitialState,
      members: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i, generateMember({ id: i })]),
      ),
      messagePagination: {
        hasPrev: true,
      },
      messages: Array.from({ length: 10 }, (_, i) => generateMessage({ id: i })),
    };
    const watchSpy = jest.fn();

    channel.offlineMode = false;
    channel.initialied = false;
    channel.watch = watchSpy;

    renderComponent({ channel });

    const { result: channelMessageState } = renderHook(() => useChannelMessageDataState(channel));
    const { result: channelState } = renderHook(() => useChannelDataState(channel));

    await waitFor(() => expect(watchSpy).toHaveBeenCalled());
    await waitFor(() => expect(channelMessageState.current.state.messages).toHaveLength(10));
    await waitFor(() => expect(Object.keys(channelState.current.state.members)).toHaveLength(10));
  });

  function getElementsAround(array, key, id) {
    const index = array.findIndex((obj) => obj[key] === id);

    if (index === -1) {
      return [];
    }

    const start = Math.max(0, index - 12); // 12 before the index
    const end = Math.min(array.length, index + 13); // 12 after the index
    return array.slice(start, end);
  }

  it('should call the loadChannelAroundMessage when messageId is passed to a channel', async () => {
    const messages = Array.from({ length: 105 }, (_, i) => generateMessage({ id: i }));
    const messageToSearch = messages[50];
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const loadMessageIntoState = jest.fn(() => {
      const newMessages = getElementsAround(messages, 'id', messageToSearch.id);
      channel.state.messages = newMessages;
    });

    channel.state = {
      ...channelInitialState,
      loadMessageIntoState,
      messagePagination: {
        hasNext: true,
        hasPrev: true,
      },
      messages,
    };

    renderComponent({ channel, messageId: messageToSearch.id });

    await waitFor(() => {
      expect(loadMessageIntoState).toHaveBeenCalledWith(messageToSearch.id, undefined, 25);
    });

    const { result: channelMessageState } = renderHook(() => useChannelMessageDataState(channel));
    await waitFor(() => expect(channelMessageState.current.state.messages).toHaveLength(25));
    await waitFor(() =>
      expect(
        channelMessageState.current.state.messages.find(
          (message) => message.id === messageToSearch.id,
        ),
      ).toBeTruthy(),
    );
  });

  describe('initialScrollToFirstUnreadMessage', () => {
    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks();
      // Restore all mocks to their original implementation
      jest.restoreAllMocks();
      cleanup();
    });
    const mockedHook = (values) =>
      jest.spyOn(MessageListPaginationHooks, 'useMessageListPagination').mockImplementation(() => ({
        copyMessagesStateFromChannel: jest.fn(),
        loadChannelAroundMessage: jest.fn(),
        loadChannelAtFirstUnreadMessage: jest.fn(),
        loadInitialMessagesStateFromChannel: jest.fn(),
        loadLatestMessages: jest.fn(),
        loadMore: jest.fn(),
        loadMoreRecent: jest.fn(),
        state: { ...channelInitialState },
        ...values,
      }));
    it("should not call loadChannelAtFirstUnreadMessage if channel's unread count is 0", async () => {
      const mockedChannel = generateChannelResponse({
        messages: Array.from({ length: 10 }, (_, i) => generateMessage({ text: `message-${i}` })),
      });

      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      const channel = chatClient.channel('messaging', mockedChannel.id);
      await channel.watch();
      const user = generateUser();
      const read_data = {};

      read_data[chatClient.user.id] = {
        last_read: new Date(),
        user,
      };

      channel.state = {
        ...channelInitialState,
        read: read_data,
      };
      jest.spyOn(channel, 'countUnread').mockImplementation(() => 0);

      const loadChannelAtFirstUnreadMessageFn = jest.fn();

      mockedHook({ loadChannelAtFirstUnreadMessage: loadChannelAtFirstUnreadMessageFn });

      renderComponent({ channel, initialScrollToFirstUnreadMessage: true });

      await waitFor(() => {
        expect(loadChannelAtFirstUnreadMessageFn).not.toHaveBeenCalled();
      });
    });

    it("should call loadChannelAtFirstUnreadMessage if channel's unread count is greater than 0", async () => {
      const mockedChannel = generateChannelResponse({
        messages: Array.from({ length: 10 }, (_, i) => generateMessage({ text: `message-${i}` })),
      });

      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      const channel = chatClient.channel('messaging', mockedChannel.id);
      await channel.watch();

      const user = generateUser();
      const numberOfUnreadMessages = 15;
      const read_data = {};

      read_data[chatClient.user.id] = {
        last_read: new Date(),
        unread_messages: numberOfUnreadMessages,
        user,
      };
      channel.state = {
        ...channelInitialState,
        read: read_data,
      };

      jest.spyOn(channel, 'countUnread').mockImplementation(() => numberOfUnreadMessages);
      const loadChannelAtFirstUnreadMessageFn = jest.fn();

      mockedHook({ loadChannelAtFirstUnreadMessage: loadChannelAtFirstUnreadMessageFn });

      renderComponent({ channel, initialScrollToFirstUnreadMessage: true });

      await waitFor(() => {
        expect(loadChannelAtFirstUnreadMessageFn).toHaveBeenCalled();
      });
    });

    it("should not call loadChannelAtFirstUnreadMessage if channel's unread count is greater than 0 lesser than scrollToFirstUnreadThreshold", async () => {
      const mockedChannel = generateChannelResponse({
        messages: Array.from({ length: 10 }, (_, i) => generateMessage({ text: `message-${i}` })),
      });

      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      const channel = chatClient.channel('messaging', mockedChannel.id);
      await channel.watch();

      const user = generateUser();
      const numberOfUnreadMessages = 2;
      const read_data = {};

      read_data[chatClient.user.id] = {
        last_read: new Date(),
        unread_messages: numberOfUnreadMessages,
        user,
      };
      channel.state = {
        ...channelInitialState,
        read: read_data,
      };

      jest.spyOn(channel, 'countUnread').mockImplementation(() => numberOfUnreadMessages);
      const loadChannelAtFirstUnreadMessageFn = jest.fn();

      mockedHook({ loadChannelAtFirstUnreadMessage: loadChannelAtFirstUnreadMessageFn });

      renderComponent({ channel, initialScrollToFirstUnreadMessage: true });

      await waitFor(() => {
        expect(loadChannelAtFirstUnreadMessageFn).not.toHaveBeenCalled();
      });
    });
  });

  it('should call resyncChannel when connection changed event is triggered', async () => {
    const mockedChannel = generateChannelResponse({
      messages: Array.from({ length: 10 }, (_, i) => generateMessage({ text: `message-${i}` })),
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    renderComponent({ channel });

    await waitFor(() => {
      act(() => dispatchConnectionChanged(chatClient, false));
    });

    await waitFor(() => {
      channel.state.addMessagesSorted(
        Array.from({ length: 10 }, (_, i) =>
          generateMessage({ status: 'failed', text: `message-${i}` }),
        ),
      );
    });

    await waitFor(() => {
      act(() => dispatchConnectionChanged(chatClient));
    });

    await waitFor(() => {
      expect(channel.state.messages.length).toBe(20);
    });
  });
});
