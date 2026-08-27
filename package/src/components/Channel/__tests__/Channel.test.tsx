import React, { type ComponentProps, useContext, useEffect } from 'react';
import { View } from 'react-native';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat as StreamChatType } from 'stream-chat';
import { StreamChat, Thread } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import { ChannelContext, ChannelProvider } from '../../../contexts/channelContext/ChannelContext';
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
import { Thread as ThreadComponent } from '../../Thread/Thread';
import { Channel } from '../Channel';
import * as MessageListPaginationHooks from '../hooks/useMessageListPagination';

// Local test fixture (was previously imported from the now-removed useChannelDataState hook).
const channelInitialState = {
  hasMore: true,
  hasMoreNewer: false,
  loading: false,
  loadingMore: false,
  loadingMoreRecent: false,
  members: {},
  messages: [],
  pinnedMessages: [],
  read: {},
  targetedMessageId: undefined,
  typing: {},
  watcherCount: 0,
  watchers: {},
};

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
  context: React.Context<unknown> = ChannelContext as React.Context<unknown>,
) =>
  render(
    <Chat client={chatClient}>
      <Channel {...(props as React.ComponentProps<typeof Channel>)}>
        {props.children}
        <CallbackEffectWithContext {...{ callback, context }} />
      </Channel>
    </Chat>,
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
    // `channel.getConfig()` is gone; `serverConfig` is a getter over the client's store. Nothing here
    // asserts on the value, so seeding an empty config for this cid is enough to stand in for the spy.
    chatClient.channelServerConfigsStore.partialNext({
      configs: { ...chatClient.channelServerConfigs, [channel.cid]: {} as never },
    });
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
    // Rejected persistently, at the API seam: an offline open fails the mount `watch()` AND the
    // paginator seed that follows it, and it is the paginator's own failed query that records
    // `lastQueryError` — the only error surface this component reads.
    jest.spyOn(channel, 'getOrCreate').mockRejectedValue(watchError);
    // No item window is seeded on purpose: a load that never succeeded leaves `items` undefined, and
    // the LoadingErrorIndicator has to render for that as much as for an empty array.

    const { getByTestId } = renderComponent({ channel });

    await waitFor(() => expect(getByTestId('loading-error')).toBeTruthy());
  });

  it('still seeds the paginator when the mount watch fails, so the failure is recorded', async () => {
    // `watch()` does not go through the paginator, so its throw records nothing. The seed is
    // therefore NOT skipped on a failed watch: the paginator issues its own query, and that query's
    // failure is what puts `lastQueryError` on the only error surface this component reads. Skip the
    // seed and an offline cold open renders an empty list instead of the retry screen.
    const watchError = new Error('channel watch fail');
    const getOrCreate = jest.spyOn(channel, 'getOrCreate').mockRejectedValue(watchError);

    renderComponent({ channel });

    await waitFor(() =>
      expect(channel.messagePaginator.state.getLatestValue().lastQueryError).toBe(watchError),
    );
    // Two calls, not one: the watch, then the paginator's own query. The second is the one that records.
    expect(getOrCreate.mock.calls.length).toBeGreaterThanOrEqual(2);

    // Clearing is the paginator's own job, which is what the error screen's retry relies on.
    getOrCreate.mockRestore();
    await act(async () => {
      await channel.messagePaginator.reload();
    });

    expect(channel.messagePaginator.state.getLatestValue().lastQueryError).toBeUndefined();
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

  it('exposes a thread provided via props through the thread context', async () => {
    const threadMessage = messages[0];
    const hasThread = jest.fn();
    // Threads are now fully prop-driven: passing `thread` to Channel exposes it through
    // ThreadContext synchronously as a `threadInstance` (whose `id` is the parent message id) —
    // the context no longer carries a raw `thread` message.
    renderComponent(
      { channel, thread: threadMessage, threadList: true },
      (ctx) => {
        const { threadInstance } = ctx as { threadInstance: { id: string } | null };
        if (threadInstance) {
          hasThread(threadInstance.id);
        }
      },
      ThreadContext as React.Context<unknown>,
    );

    await waitFor(() => expect(hasThread).toHaveBeenCalledWith(threadMessage.id));
  });

  const queryChannelWithNewMessages = (newMessages: ReturnType<typeof generateMessage>[]) =>
    // generate new channel mock from existing channel with new messages added
    getOrCreateChannelApi(
      generateChannelResponse({
        channel: {
          config: channel.serverConfig,
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
      MessagesContext as React.Context<unknown>,
    );

    await waitFor(() => expect(channelQuerySpy).toHaveBeenCalled());
  });

  describe('ChannelContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ChannelProvider value={{} as ChannelContextValue}>
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
      };

      render(
        <ChannelProvider value={mockContext as unknown as ChannelContextValue}>
          <ContextConsumer
            context={ChannelContext as React.Context<unknown>}
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
      });
    });
  });

  describe('MessagesContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <MessagesProvider value={{} as MessagesContextValue}>
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
            context={MessagesContext as React.Context<unknown>}
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
        <ThreadProvider value={{} as ThreadContextValue}>
          <View testID='children' />
        </ThreadProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the thread context', async () => {
      let context: ThreadContextValue | undefined;

      const mockContext = {
        allowThreadMessagesInChannel: true,
      };

      render(
        <ThreadProvider value={mockContext as unknown as ThreadContextValue}>
          <ContextConsumer
            context={ThreadContext as React.Context<unknown>}
            fn={(ctx) => {
              context = ctx as ThreadContextValue;
            }}
          />
        </ThreadProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context!.allowThreadMessagesInChannel).toBe(true);
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
    // A DB-hydrated channel that hasn't been live-watched (initialized false) deterministically
    // re-watches on mount; the paginator's isActiveIntervalAtHead heuristic is timing-dependent
    // under mocked pagination, so drive the condition explicitly instead.
    channel.initialized = false;
    const watchSpy = jest.fn();
    channel.watch = watchSpy;

    // markReadOnMount off so the mount's async read request can't fire late and leak past teardown.
    renderComponent({ channel, markReadOnMount: false });

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it('should call channel.watch on mount for a non-offline channel that needs (re)initialization', async () => {
    const messages = Array.from({ length: 10 }, (_, i) => generateMessage({ id: String(i) }));
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    // Seed 10 members reactively on the real StateStore (channel.state is no longer a plain object).
    channel.state.partialNext({
      members: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i, generateMember({ user_id: String(i) })]),
      ),
    });
    const watchSpy = jest.fn();

    channel.offlineMode = false;
    // Force the mount re-watch deterministically (isActiveIntervalAtHead is timing-dependent under
    // mocked pagination).
    channel.initialized = false;
    channel.watch = watchSpy;

    // markReadOnMount off so the mount's async read request can't fire late and leak past teardown.
    renderComponent({ channel, markReadOnMount: false });

    await waitFor(() => expect(watchSpy).toHaveBeenCalled());
    // members now come reactively from channel.state (via the shim getter).
    await waitFor(() => expect(Object.keys(channel.state.members)).toHaveLength(10));
  });

  it('should call the loadChannelAroundMessage when messageId is passed to a channel', async () => {
    const messages = Array.from({ length: 105 }, (_, i) => generateMessage({ id: String(i) }));
    const messageToSearch = messages[50];
    const mockedChannel = generateChannelResponse({
      messages,
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    // A `messageId` now drives channel.messagePaginator.jumpToMessage (load-around + focus signal),
    // replacing the removed channel.state.loadMessageIntoState.
    const jumpToMessageSpy = jest
      .spyOn(channel.messagePaginator, 'jumpToMessage')
      .mockResolvedValue(undefined as never);

    renderComponent({ channel, markReadOnMount: false, messageId: messageToSearch.id });

    await waitFor(() => {
      expect(jumpToMessageSpy).toHaveBeenCalledWith(
        messageToSearch.id,
        expect.objectContaining({ focusReason: 'jump-to-message' }),
      );
    });
  });

  describe('initialScrollToFirstUnreadMessage', () => {
    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks();
      // Restore ONLY the paginator-hook spy so sibling tests get the real hook. Deliberately not
      // restoreAllMocks: that would also drop the shared axios `request` mock, letting a still
      // in-flight mount re-watch fall through to the real HTTP adapter after the environment is torn
      // down ("require a file after the Jest environment has been torn down").
      jest.spyOn(MessageListPaginationHooks, 'useMessageListPagination').mockRestore();
      cleanup();
    });
    const mockedHook = (
      values: Partial<ReturnType<typeof MessageListPaginationHooks.useMessageListPagination>>,
    ) =>
      jest.spyOn(MessageListPaginationHooks, 'useMessageListPagination').mockImplementation(
        () =>
          ({
            loadChannelAroundMessage: jest.fn(),
            loadChannelAtFirstUnreadMessage: jest.fn(),
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

      channel.state.partialNext({ read: read_data });
      jest.spyOn(channel, 'countUnread').mockImplementation(() => 0);

      const loadChannelAtFirstUnreadMessageFn = jest.fn();

      mockedHook({ loadChannelAtFirstUnreadMessage: loadChannelAtFirstUnreadMessageFn });

      renderComponent({
        channel,
        initialScrollToFirstUnreadMessage: true,
        // Skip the incidental mark-read-on-mount so its async read request can't fire a real
        // HTTP call after this describe's afterEach restores the axios mock.
        markReadOnMount: false,
      });

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
      channel.state.partialNext({ read: read_data });

      jest.spyOn(channel, 'countUnread').mockImplementation(() => numberOfUnreadMessages);
      const loadChannelAtFirstUnreadMessageFn = jest.fn();

      mockedHook({ loadChannelAtFirstUnreadMessage: loadChannelAtFirstUnreadMessageFn });

      renderComponent({
        channel,
        initialScrollToFirstUnreadMessage: true,
        // Skip the incidental mark-read-on-mount so its async read request can't fire a real
        // HTTP call after this describe's afterEach restores the axios mock.
        markReadOnMount: false,
      });

      await waitFor(() => {
        expect(loadChannelAtFirstUnreadMessageFn).toHaveBeenCalled();
      });
    });
  });

  it('reloads the channel on reconnect while preserving failed messages', async () => {
    // The reload is issued by `client.connectionRecovery` now, not by this component — `<Channel>`
    // only marks the channel active. Asserted end to end on purpose: what matters is that a reconnect
    // still refreshes the open channel and still does not lose locally-unsent messages.
    // Deterministic timestamps so the 10 loaded messages and the 10 offline-failed messages occupy
    // adjacent, ordered positions in the paginator's active window.
    const baseTime = 1600000000000;
    const mockedChannel = generateChannelResponse({
      messages: Array.from({ length: 10 }, (_, i) =>
        generateMessage({ text: `message-${i}`, timestamp: new Date(baseTime + i * 1000) }),
      ),
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    // Call through to the real reload so the resync actually reconciles (and we can assert it ran).
    const reloadSpy = jest.spyOn(channel, 'reload');

    renderComponent({ channel });

    await waitFor(() => {
      act(() => dispatchConnectionChanged(chatClient, false));
    });

    // Simulate 10 messages sent while offline that failed. They carry the channel cid (so they pass
    // the paginator's cid match filter) and sit just after the loaded page.
    act(() => {
      Array.from({ length: 10 }, (_, i) =>
        generateMessage({
          cid: channel.cid,
          status: 'failed',
          text: `failed-message-${i}`,
          timestamp: new Date(baseTime + 100000 + i * 1000),
        }),
      ).forEach((m) => channel.messagePaginator.ingestItem(channel.state.formatMessage(m)));
    });

    await waitFor(() => {
      act(() => dispatchConnectionChanged(chatClient));
    });

    // The reload re-watches and reconciles, but preserves the failed (locally-unsent) messages —
    // the 10 originals + 10 failed remain.
    await waitFor(() => {
      expect(reloadSpy).toHaveBeenCalled();
      expect(channel.messagePaginator.headItems.length).toBe(20);
    });
  });

  // Regression guard for the reconnect refresh of an OPEN THREAD's replies, which now runs entirely in
  // `client.connectionRecovery` — this component's only part is marking the thread active.
  //
  // Asserted end to end on purpose: the LLC can only reach the thread through `client.activeThreads`,
  // and a thread resolved as `threadsById[id] ?? new Thread(...)` (the common path — see the
  // `threadInstance` memo) is in no other registry. Drop the `threadInstance.activate()` effect and
  // recovery silently skips the thread with nothing else failing, so it is pinned here.
  it('reloads an open thread on reconnect', async () => {
    const mockedChannel = generateChannelResponse({ messages: [generateMessage({})] });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const testChannel = chatClient.channel('messaging', mockedChannel.channel.id);
    await testChannel.watch();

    const parentMessage = generateMessage({ user });
    const threadInstance = new Thread({
      channel: testChannel,
      client: chatClient,
      parentMessage: testChannel.state.formatMessage(parentMessage),
    });
    const reload = jest.spyOn(threadInstance, 'reload').mockResolvedValue(undefined);
    // Recovery finds threads through `client.threads.threadsById`, and <Thread> only adopts an
    // unmanaged instance into the manager once its reply paginator has loaded (Thread.tsx:126, gated
    // on `items !== undefined`). Seed loaded-but-empty replies so that adoption actually happens —
    // without it this test exercises the documented gap (active but unadopted → skipped) rather than
    // the path it means to cover.
    act(() => threadInstance.messagePaginator.state.partialNext({ items: [], isLoading: false }));

    render(
      <Chat client={chatClient}>
        <Channel
          channel={testChannel}
          // `threadList` is what makes this <Channel> the one that owns the thread view
          // (`shouldSyncChannel`); without it the channel view would claim it instead.
          threadList
          thread={{ thread: testChannel.state.formatMessage(parentMessage), threadInstance }}
        >
          {/* The real <Thread> is what calls `threadInstance.activate()`, which is the ONLY thing
              that puts the instance in `client.activeThreads` for recovery to find. Rendering it is
              the point of the test — a bare <Channel> would not activate anything. */}
          <ThreadComponent />
        </Channel>
      </Chat>,
    );

    // Wait for <Thread> to activate AND adopt the instance — both are preconditions for recovery to
    // see it at all. (With replies seeded above, Thread.tsx's mount metadata-reload is skipped, so
    // the spy is clean; cleared anyway so this can only pass on a reconnect-driven call.)
    await waitFor(() => {
      expect(chatClient.threads.threadsById[threadInstance.id]).toBeDefined();
      expect(threadInstance.state.getLatestValue().active).toBe(true);
    });
    reload.mockClear();

    act(() => dispatchConnectionChanged(chatClient, false));
    act(() => dispatchConnectionChanged(chatClient));

    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it('does not mark a reply-less thread read on open, but does once it has replies', async () => {
    // A parent with no replies has no server-side thread, so the mark-read 404s on every open. There
    // is also nothing that could be unread, so the call is skipped rather than made and swallowed.
    const mockedChannel = generateChannelResponse({ messages: [generateMessage({})] });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const testChannel = chatClient.channel('messaging', mockedChannel.channel.id);
    await testChannel.watch();
    const markRead = jest
      .spyOn(testChannel, 'markRead')
      .mockResolvedValue({} as Awaited<ReturnType<typeof testChannel.markRead>>);

    const parentMessage = generateMessage({ user });
    const makeThread = (replyCount: number) => {
      const instance = new Thread({
        channel: testChannel,
        client: chatClient,
        parentMessage: testChannel.state.formatMessage({
          ...parentMessage,
          reply_count: replyCount,
        }),
      });
      jest.spyOn(instance, 'reload').mockResolvedValue(undefined);
      return instance;
    };

    const empty = makeThread(0);
    const { unmount } = render(
      <Chat client={chatClient}>
        <Channel
          channel={testChannel}
          threadList
          thread={{ thread: testChannel.state.formatMessage(parentMessage), threadInstance: empty }}
        >
          <ThreadComponent />
        </Channel>
      </Chat>,
    );
    await waitFor(() => expect(empty.state.getLatestValue().active).toBe(true));
    expect(markRead).not.toHaveBeenCalled();
    unmount();

    // Same component, a thread that does have replies: the call is made as before.
    const withReplies = makeThread(3);
    render(
      <Chat client={chatClient}>
        <Channel
          channel={testChannel}
          threadList
          thread={{
            thread: testChannel.state.formatMessage(parentMessage),
            threadInstance: withReplies,
          }}
        >
          <ThreadComponent />
        </Channel>
      </Chat>,
    );
    await waitFor(() => expect(markRead).toHaveBeenCalledWith({ thread_id: withReplies.id }));
  });
});
