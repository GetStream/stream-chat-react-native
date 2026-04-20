import React, { type ComponentProps, useContext, useEffect } from 'react';
import { View } from 'react-native';

import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat as StreamChatType } from 'stream-chat';
import { StreamChat } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import { ChannelContext, ChannelProvider } from '../../../contexts/channelContext/ChannelContext';
import { ChannelsStateProvider } from '../../../contexts/channelsStateContext/ChannelsStateContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import {
  MessagesContext,
  MessagesProvider,
} from '../../../contexts/messagesContext/MessagesContext';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
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
const CallbackEffectWithContext = ({
  callback,
  context,
}: {
  callback: (ctx: unknown) => void;
  context: React.Context<unknown>;
}) => {
  const ctx = useContext(context);
  useEffect(() => {
    callback(ctx);
  }, [callback, ctx]);

  return <View />;
};

const ContextConsumer = ({
  context,
  fn,
}: {
  context: React.Context<unknown>;
  fn: (ctx: unknown) => void;
}) => {
  fn(useContext(context));
  return <View testID='children' />;
};

const channelType = 'messaging';
const channelId = 'test-channel';
const channelCid = `${channelType}:${channelId}`;
let chatClient: StreamChatType;
let channel: ChannelType;

const user = generateUser({ id: 'id', name: 'name' });
const messages = [generateMessage({ cid: channelCid, user })];

type RenderComponentProps = Partial<Omit<ComponentProps<typeof Channel>, 'channel'>> & {
  channel?: unknown;
  children?: React.ReactNode;
};

const renderComponent = (
  props: RenderComponentProps = {},
  callback: (ctx: unknown) => void = () => {},
  context: React.Context<unknown> = ChannelContext as unknown as React.Context<unknown>,
) =>
  render(
    <ChannelsStateProvider>
      <Chat client={chatClient}>
        <Channel {...(props as React.ComponentProps<typeof Channel>)}>
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
      channel: { cid: channelCid },
      id: channelId,
      members,
      messages,
      type: channelType,
    });
    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.channel.id);
    channel.cid = mockedChannel.channel.cid as string;
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
      (ctx) => {
        const { openThread, thread } = ctx as {
          openThread: (m: unknown) => void;
          thread: { id: string } | null;
        };
        if (!thread) {
          openThread(threadMessage);
        } else {
          hasThread(thread.id);
        }
      },
      ThreadContext as unknown as React.Context<unknown>,
    );

    rerender(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <CallbackEffectWithContext
              callback={(ctx) => {
                const { openThread, thread } = ctx as {
                  openThread: (m: unknown) => void;
                  thread: { id: string } | null;
                };
                if (!thread) {
                  openThread(threadMessage);
                } else {
                  hasThread(thread.id);
                }
              }}
              context={ThreadContext as unknown as React.Context<unknown>}
            />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );
    await waitFor(() => expect(hasThread).toHaveBeenCalledWith(threadMessage.id));
  });

  const queryChannelWithNewMessages = (newMessages: ReturnType<typeof generateMessage>[]) =>
    // generate new channel mock from existing channel with new messages added
    getOrCreateChannelApi(
      generateChannelResponse({
        channel: {
          config: channel.getConfig(),
          id: channel.id,
          type: channel.type,
        } as unknown as NonNullable<Parameters<typeof generateChannelResponse>[0]>['channel'],
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
      MessagesContext as unknown as React.Context<unknown>,
    );

    await waitFor(() => expect(channelQuerySpy).toHaveBeenCalled());
  });

  describe('ChannelContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ChannelProvider value={{} as unknown as ChannelContextValue}>
          <View testID='children' />
        </ChannelProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the channel context', async () => {
      let context: ChannelContextValue | undefined;

      const mockContext = {
        channel,
        client: chatClient,
        markRead: () => {},
        watcherCount: 5,
      };

      render(
        <ChannelProvider value={mockContext as unknown as ChannelContextValue}>
          <ContextConsumer
            context={ChannelContext as unknown as React.Context<unknown>}
            fn={(ctx) => {
              context = ctx as ChannelContextValue;
            }}
          />
        </ChannelProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        const ctx = context as unknown as typeof mockContext;
        expect(ctx.channel).toBeInstanceOf(Object);
        expect(ctx.client).toBeInstanceOf(StreamChat);
        expect(ctx.markRead).toBeInstanceOf(Function);
        expect(ctx.watcherCount).toBe(5);
      });
    });
  });

  describe('MessagesContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <MessagesProvider value={{} as unknown as MessagesContextValue}>
          <View testID='children' />
        </MessagesProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the messages context', async () => {
      let context: MessagesContextValue | undefined;

      const mockContext = {
        Attachment,
        editing: false,
        messages,
        sendMessage: () => {},
      };

      render(
        <MessagesProvider value={mockContext as unknown as MessagesContextValue}>
          <ContextConsumer
            context={MessagesContext as unknown as React.Context<unknown>}
            fn={(ctx) => {
              context = ctx as MessagesContextValue;
            }}
          />
        </MessagesProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        const ctx = context as unknown as typeof mockContext;
        expect(ctx.Attachment).toBeInstanceOf(Function);
        expect(ctx.editing).toBe(false);
        expect(ctx.messages).toBeInstanceOf(Array);
        expect(ctx.sendMessage).toBeInstanceOf(Function);
      });
    });
  });

  describe('ThreadContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ThreadProvider value={{} as unknown as ThreadContextValue}>
          <View testID='children' />
        </ThreadProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the thread context', async () => {
      let context: ThreadContextValue | undefined;

      const mockContext = {
        openThread: () => {},
        thread: {},
        threadHasMore: true,
        threadLoadingMore: false,
      };

      render(
        <ThreadProvider value={mockContext as unknown as ThreadContextValue}>
          <ContextConsumer
            context={ThreadContext as unknown as React.Context<unknown>}
            fn={(ctx) => {
              context = ctx as ThreadContextValue;
            }}
          />
        </ThreadProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context!.openThread).toBeInstanceOf(Function);
        expect(context!.thread).toBeInstanceOf(Object);
        expect(context!.threadHasMore).toBe(true);
        expect(context!.threadLoadingMore).toBe(false);
      });
    });
  });
});

describe('Channel initial load useEffect', () => {
  let chatClient: StreamChatType;

  const renderComponent = (props: RenderComponentProps = {}) =>
    render(
      <Chat client={chatClient}>
        <Channel {...(props as React.ComponentProps<typeof Channel>)}>{props.children}</Channel>
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
    const messages = Array.from({ length: 10 }, (_, i) => generateMessage({ id: String(i) }));
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();
    channel.offlineMode = true;
    channel.state = {
      ...channelInitialState,
      messagePagination: {
        hasPrev: true,
      },
    } as unknown as typeof channel.state;
    const watchSpy = jest.fn();
    channel.watch = watchSpy;

    renderComponent({ channel });

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it("should call channel.watch if channel is initialized and it's not in offline mode", async () => {
    const messages = Array.from({ length: 10 }, (_, i) => generateMessage({ id: String(i) }));
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    channel.state = {
      ...channelInitialState,
      members: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [
          i,
          generateMember({ user_id: String(i) } as unknown as Partial<
            Parameters<typeof generateMember>[0]
          >),
        ]),
      ),
      messagePagination: {
        hasPrev: true,
      },
      messages: Array.from({ length: 10 }, (_, i) => generateMessage({ id: String(i) })),
    } as unknown as typeof channel.state;
    const watchSpy = jest.fn();

    channel.offlineMode = false;
    (channel as unknown as { initialied: boolean }).initialied = false;
    channel.watch = watchSpy;

    renderComponent({ channel });

    const { result: channelMessageState } = renderHook(() => useChannelMessageDataState(channel));
    const { result: channelState } = renderHook(() => useChannelDataState(channel));

    await waitFor(() => expect(watchSpy).toHaveBeenCalled());
    await waitFor(() => expect(channelMessageState.current.state.messages!).toHaveLength(10));
    await waitFor(() => expect(Object.keys(channelState.current.state.members!)).toHaveLength(10));
  });

  function getElementsAround<T extends object>(array: T[], key: keyof T, id: unknown) {
    const index = array.findIndex((obj) => obj[key] === id);

    if (index === -1) {
      return [];
    }

    const start = Math.max(0, index - 12); // 12 before the index
    const end = Math.min(array.length, index + 13); // 12 after the index
    return array.slice(start, end);
  }

  it('should call the loadChannelAroundMessage when messageId is passed to a channel', async () => {
    const messages = Array.from({ length: 105 }, (_, i) => generateMessage({ id: String(i) }));
    const messageToSearch = messages[50];
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    const loadMessageIntoState = jest.fn(() => {
      const newMessages = getElementsAround(
        messages as unknown as typeof channel.state.messages,
        'id',
        messageToSearch.id,
      );
      channel.state.messages = newMessages as unknown as typeof channel.state.messages;
    });

    channel.state = {
      ...channelInitialState,
      loadMessageIntoState,
      messagePagination: {
        hasNext: true,
        hasPrev: true,
      },
      messages,
    } as unknown as typeof channel.state;

    renderComponent({ channel, messageId: messageToSearch.id });

    await waitFor(() => {
      expect(loadMessageIntoState).toHaveBeenCalledWith(messageToSearch.id, undefined, 25);
    });

    const { result: channelMessageState } = renderHook(() => useChannelMessageDataState(channel));
    await waitFor(() => expect(channelMessageState.current.state.messages!).toHaveLength(25));
    await waitFor(() =>
      expect(
        channelMessageState.current.state.messages!.find(
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
    const mockedHook = (
      values: Partial<ReturnType<typeof MessageListPaginationHooks.useMessageListPagination>>,
    ) =>
      jest.spyOn(MessageListPaginationHooks, 'useMessageListPagination').mockImplementation(
        () =>
          ({
            copyMessagesStateFromChannel: jest.fn(),
            loadChannelAroundMessage: jest.fn(),
            loadChannelAtFirstUnreadMessage: jest.fn(),
            loadInitialMessagesStateFromChannel: jest.fn(),
            loadLatestMessages: jest.fn(),
            loadMore: jest.fn(),
            loadMoreRecent: jest.fn(),
            state: { ...channelInitialState },
            ...values,
          }) as unknown as ReturnType<typeof MessageListPaginationHooks.useMessageListPagination>,
      );
    it("should not call loadChannelAtFirstUnreadMessage if channel's unread count is 0", async () => {
      const mockedChannel = generateChannelResponse({
        messages: Array.from({ length: 10 }, (_, i) => generateMessage({ text: `message-${i}` })),
      });

      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      const channel = chatClient.channel('messaging', mockedChannel.channel.id);
      await channel.watch();
      const user = generateUser();
      const read_data: typeof channel.state.read = {};

      read_data[chatClient.user!.id] = {
        last_read: new Date(),
        user,
      } as unknown as (typeof channel.state.read)[string];

      channel.state = {
        ...channelInitialState,
        read: read_data,
      } as unknown as typeof channel.state;
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
      const channel = chatClient.channel('messaging', mockedChannel.channel.id);
      await channel.watch();

      const user = generateUser();
      const numberOfUnreadMessages = 15;
      const read_data: typeof channel.state.read = {};

      read_data[chatClient.user!.id] = {
        last_read: new Date(),
        unread_messages: numberOfUnreadMessages,
        user,
      };
      channel.state = {
        ...channelInitialState,
        read: read_data,
      } as unknown as typeof channel.state;

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
      const channel = chatClient.channel('messaging', mockedChannel.channel.id);
      await channel.watch();

      const user = generateUser();
      const numberOfUnreadMessages = 2;
      const read_data: typeof channel.state.read = {};

      read_data[chatClient.user!.id] = {
        last_read: new Date(),
        unread_messages: numberOfUnreadMessages,
        user,
      };
      channel.state = {
        ...channelInitialState,
        read: read_data,
      } as unknown as typeof channel.state;

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
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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
