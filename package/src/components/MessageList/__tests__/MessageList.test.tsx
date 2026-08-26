import React from 'react';

import { FlatList } from 'react-native';

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { UserResponse } from 'stream-chat';

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
import * as MessageListPaginationHook from '../../Channel/hooks/useMessageListPagination';
import { Chat } from '../../Chat/Chat';

import { SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME } from '../hooks/useScrollToBottomAccessibilityAction';
import { MessageList } from '../MessageList';

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

describe('MessageList', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    // Time-ordered seed so the channel opens at its latest set (hasMoreHead=false) and the
    // scroll-to-bottom button stays hidden — a random-order page can leave it unsettled.
    const base = new Date('2020-01-01T00:00:00.000Z').getTime();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
      messages: [
        generateMessage({ timestamp: new Date(base), user: user1 }),
        generateMessage({ timestamp: new Date(base + 1000), user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

    // The message paginator's ingest filter keys on the message's `cid`, so a cid-less message.new
    // is dropped and never reaches the list. Stamp the channel cid onto the new message.
    const newMessage = generateMessage({ cid: channel.cid, user: user2 });
    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel));

    await waitFor(() => {
      expect(queryAllByTestId('scroll-to-bottom-button')).toHaveLength(0);
      expect(getByText(newMessage.text as string)).toBeTruthy();
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

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

  it('should render the typing indicator when typing object is non empty', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

  it('should render client notifications in the message list notification host', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    const { getByText } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    act(() => {
      chatClient.notifications.add({
        message: 'Message list notification',
        options: { severity: 'warning' },
        origin: { emitter: 'MessageListTest' },
      });
    });

    await waitFor(() => {
      expect(getByText('Message list notification')).toBeTruthy();
    });
  });

  it('should render the is offline error', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

    // A long, time-ordered list so a target near the oldest end sits far outside the FlatList's
    // initially rendered window. Ordered timestamps keep the paginator's position deterministic (a
    // tight `new Date()` loop yields near-identical timestamps and a scrambled sort order).
    const base = new Date('2020-01-01T00:00:00.000Z').getTime();
    const mockedLongMessagesList = Array.from({ length: 151 }, (_, i) =>
      generateMessage({
        id: `${i}`,
        text: `message-${i}`,
        timestamp: new Date(base + i * 1000),
        user: user1,
      }),
    );
    // An old message (near the oldest end) — index 3 lands at index 147 of the newest-first list,
    // deep outside the ~10 rows the headless FlatList renders on mount.
    const targetedMessageId = mockedLongMessagesList[3].id;

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: mockedLongMessagesList,
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    // The paginator's focus signal (emitted by jump-to-message) drives the scroll. Spy on the
    // FlatList's scrollToIndex — a no-op in the headless renderer — to assert the list positions
    // itself on the far-off target rather than checking rendered rows (v10 scrolls to the target
    // after render; it no longer seeds it into the initial window).
    const scrollToIndexMock = jest
      .spyOn(FlatList.prototype, 'scrollToIndex')
      .mockImplementation(() => {});

    channel.messagePaginator.emitMessageFocusSignal({
      messageId: targetedMessageId,
      reason: 'jump-to-message',
      ttlMs: 3000,
    });

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(scrollToIndexMock).toHaveBeenCalledWith({
        animated: true,
        index: 147,
        viewPosition: 0.5,
      });
    });
  });

  it("should render the unread messages notification when there's unread messages", async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    // Time-ordered messages so the paginator seed reaches its own head/tail (matching a real server
    // response); a randomly-ordered page leaves hasMore* flags unsettled.
    const base = new Date('2020-01-01T00:00:00.000Z').getTime();
    const messages = Array.from({ length: 10 }, (_, i) =>
      generateMessage({ id: `${i}`, text: `message-${i}`, timestamp: new Date(base + i * 1000) }),
    );
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
      messages,
      // Own read boundary: last read at message '5', five messages unread. The paginator derives its
      // `unreadStateSnapshot` (the v10 source of truth for unread UI) from this on channel open.
      read: [
        {
          user: user1,
          last_read: new Date(base + 5000).toISOString(),
          last_read_message_id: '5',
          unread_messages: 5,
        },
      ] as unknown as NonNullable<Parameters<typeof generateChannelResponse>[0]>['read'],
    });

    const chatClient = await getTestClientWithUser({ id: user1.id } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    // Accessibility enabled so the notification's affordances expose their a11y labels (the SDK skips
    // the i18n lookup for those when accessibility is off).
    const { getByTestId, queryByLabelText } = render(
      <OverlayProvider accessibility={{ enabled: true }}>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    // The sticky unread notification opens from viewability (the last-read message scrolled out of
    // view with newer messages below). The headless FlatList never fires viewability on its own, so
    // drive it directly with a window of messages newer than the last-read boundary.
    act(() => {
      getByTestId('message-flat-list').props.onViewableItemsChanged({
        viewableItems: [
          { item: { message: messages[6] } },
          { item: { message: messages[7] } },
          { item: { message: messages[8] } },
        ],
      });
    });

    await waitFor(() => {
      expect(queryByLabelText('Dismiss unread messages')).toBeTruthy();
    });
  });

  it("should render the InlineUnreadIndicator when there's unread messages", async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    // Time-ordered messages so the paginator seeds a settled head/tail and the unread boundary is
    // derived from real created_at ordering (matching a server response).
    const base = new Date('2020-01-01T00:00:00.000Z').getTime();
    const messages = Array.from({ length: 10 }, (_, i) =>
      generateMessage({ id: `${i}`, text: `message-${i}`, timestamp: new Date(base + i * 1000) }),
    );
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
      messages,
      // Own read boundary at message '5': everything created after it is unread-from-another. The
      // paginator derives its `unreadStateSnapshot` from this on channel open, which drives the
      // inline separator above the first unread row — independent of viewability (unlike the floating
      // notification test above, which must scroll the last-read message out of view).
      read: [
        {
          user: user1,
          last_read: new Date(base + 5000).toISOString(),
          last_read_message_id: '5',
          unread_messages: 4,
        },
      ] as unknown as NonNullable<Parameters<typeof generateChannelResponse>[0]>['read'],
    });

    const chatClient = await getTestClientWithUser({ id: user1.id } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    const { queryByLabelText } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
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

    const chatClient = await getTestClientWithUser({ id: user1.id } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    channel.state.partialNext({ read: {} });
    channel.messagePaginator.state.partialNext({ items: messages });

    const { queryByLabelText } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
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
    // Seed a small initial page so the paginator has a live head interval; the source's markRead gate
    // (`!hasReadLastMessage`) compares the latest loaded message id against the own read boundary.
    const base = new Date('2020-01-01T00:00:00.000Z').getTime();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user })],
      messages: Array.from({ length: 3 }, (_, i) =>
        generateMessage({ id: `${i}`, timestamp: new Date(base + i * 1000), user }),
      ),
    });

    const chatClient = await getTestClientWithUser({ id: user.id } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

    // Auto-mark-read only fires while the user is viewing the live (latest) window. Viewability — the
    // signal that sets this — never fires in the headless renderer, so mark it explicitly.
    act(() => {
      channel.messagePaginator.setViewingLive(true);
    });
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

    const chatClient = await getTestClientWithUser({ id: user.id } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    const targetedMessage = messages[15].id;

    channel.state.partialNext({ read: {} });
    channel.messagePaginator.state.partialNext({ items: messages });

    const flatListRefMock = jest
      .spyOn(FlatList.prototype, 'scrollToIndex')
      .mockImplementation(() => {});

    // Targeting is driven by the paginator's messageFocusSignal now (not a prop): emitting it makes
    // the list scroll to the focused message.
    channel.messagePaginator.emitMessageFocusSignal({
      messageId: targetedMessage,
      reason: 'jump-to-message',
      ttlMs: 3000,
    });

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
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
});

describe('MessageList pagination', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const mockedHook = (
    values: Partial<ReturnType<typeof MessageListPaginationHook.useMessageListPagination>>,
  ) => {
    const messages = Array.from({ length: 100 }, (_, i) =>
      generateMessage({ text: `message-${i}` }),
    );
    return jest
      .spyOn(MessageListPaginationHook, 'useMessageListPagination')
      .mockImplementation(() => ({
        loadChannelAroundMessage: jest.fn(),
        loadChannelAtFirstUnreadMessage: jest.fn(),
        loadLatestMessages: jest.fn(),
        loadMore: jest.fn(),
        loadMoreRecent: jest.fn(),
        state: { ...channelInitialState, messages },
        ...values,
      }));
  };

  const renderMessageListForScrollToBottom = async ({
    additionalFlatListProps,
    accessibility = { enabled: true },
    staleChannelState = false,
  }: {
    additionalFlatListProps?: React.ComponentProps<typeof MessageList>['additionalFlatListProps'];
    accessibility?: React.ComponentProps<typeof OverlayProvider>['accessibility'];
    staleChannelState?: boolean;
  } = {}) => {
    const user1 = generateUser();
    // Time-ordered so the seeded page reaches its own head (hasMoreHead=false): the channel opens at
    // the latest set, so the scroll-to-bottom button starts hidden (a random-order page leaves
    // hasMoreHead unsettled and the button would show on open).
    const base = new Date('2020-01-01T00:00:00.000Z').getTime();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: Array.from({ length: 10 }, (_, i) =>
        generateMessage({ text: `message-${i}`, timestamp: new Date(base + i * 1000) }),
      ),
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    if (staleChannelState) {
      channel.state.partialNext({
        members: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [i, generateMember({ user_id: String(i) })]),
        ),
      });
      // hasMoreHead:true = the loaded window is NOT the latest set (the user jumped to an older
      // window), so "go to latest" reloads the channel (loadLatestMessages) instead of just
      // scrolling — that reload is what these accessibility-action tests assert.
      channel.messagePaginator.state.partialNext({
        hasMoreHead: true,
        items: Array.from({ length: 10 }, (_, i) => generateMessage({ id: String(i) })),
      });
    }

    return render(
      <OverlayProvider accessibility={accessibility}>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList additionalFlatListProps={additionalFlatListProps} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );
  };

  it('should load more recent messages when the user scrolls to the start of the list', async () => {
    const user1 = generateUser();
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: Array.from({ length: 100 }, (_, i) => generateMessage({ text: `message-${i}` })),
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
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

  // FLAKY (~20% of runs, pre-existing on V10 — this body is byte-identical there). Fails as
  // "Exceeded timeout of 5000 ms": the test intermittently stalls 5-15s and then completes, so a
  // raised timeout makes it pass (measured: 16s vs a 1.9s baseline). Ruled out: cold jest cache (a
  // 15.9s cold run passed all 21) and network retries (no retry/error noise in the logs). Also note
  // the `fireEvent.press` below sits inside `waitFor`, whose callback is retried — hoisting the
  // press out is correct but did NOT change the failure rate, so it is not the cause. Not skipped
  // on purpose: it should keep failing visibly until the stall is understood.
  it('should call load latest messages when the scroll to bottom button is pressed', async () => {
    const user1 = generateUser();
    const messages = Array.from({ length: 10 }, (_, i) =>
      generateMessage({ text: `message-${i}` }),
    );
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages,
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    channel.state.partialNext({
      members: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i, generateMember({ user_id: String(i) })]),
      ),
    });
    channel.messagePaginator.state.partialNext({
      items: Array.from({ length: 10 }, (_, i) => generateMessage({ id: String(i) })),
    });

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

  it('should not expose the scroll to bottom accessibility action when hidden', async () => {
    const { getByTestId, queryByTestId } = await renderMessageListForScrollToBottom();

    await waitFor(() => {
      expect(queryByTestId('scroll-to-bottom-button')).toBeFalsy();
      expect(getByTestId('message-flat-list').props.accessibilityActions).toBeUndefined();
    });
  });

  it('should not expose the SDK scroll to bottom action when SDK accessibility is disabled', async () => {
    const { getByTestId, queryByTestId } = await renderMessageListForScrollToBottom({
      accessibility: { enabled: false },
      staleChannelState: true,
    });

    act(() => {
      fireEvent(getByTestId('message-flat-list'), 'scroll', {
        nativeEvent: {
          contentOffset: { y: 1900 },
          contentSize: { height: 2000, width: 200 },
          layoutMeasurement: { height: 400, width: 200 },
        },
      });
    });

    await waitFor(() => {
      expect(queryByTestId('scroll-to-bottom-button')).toBeTruthy();
      expect(getByTestId('message-flat-list').props.accessibilityActions ?? []).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME,
          }),
        ]),
      );
    });
  });

  it('should preserve additional message list accessibility actions when scroll to bottom is hidden', async () => {
    const { getByTestId, queryByTestId } = await renderMessageListForScrollToBottom({
      additionalFlatListProps: {
        accessibilityActions: [{ label: 'Custom action', name: 'customAction' }],
      },
    });

    await waitFor(() => {
      expect(queryByTestId('scroll-to-bottom-button')).toBeFalsy();
      expect(getByTestId('message-flat-list').props.accessibilityActions).toEqual([
        { label: 'Custom action', name: 'customAction' },
      ]);
    });
  });

  it('should expose scroll to bottom as a message list accessibility action when visible', async () => {
    const loadLatestMessages = jest.fn(() => Promise.resolve());
    mockedHook({ loadLatestMessages });

    const { getByTestId } = await renderMessageListForScrollToBottom({
      staleChannelState: true,
    });

    act(() => {
      fireEvent(getByTestId('message-flat-list'), 'scroll', {
        nativeEvent: {
          contentOffset: { y: 1900 },
          contentSize: { height: 2000, width: 200 },
          layoutMeasurement: { height: 400, width: 200 },
        },
      });
    });

    await waitFor(() => {
      expect(getByTestId('message-flat-list').props.accessibilityActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: expect.stringContaining('Scroll to bottom'),
            name: SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME,
          }),
        ]),
      );
    });

    await act(async () => {
      await getByTestId('message-flat-list').props.onAccessibilityAction({
        nativeEvent: { actionName: SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME },
      });
    });

    expect(loadLatestMessages).toHaveBeenCalledTimes(1);
  });

  it('should preserve additional message list accessibility actions', async () => {
    const loadLatestMessages = jest.fn(() => Promise.resolve());
    const onAccessibilityAction = jest.fn();
    mockedHook({ loadLatestMessages });

    const { getByTestId } = await renderMessageListForScrollToBottom({
      additionalFlatListProps: {
        accessibilityActions: [{ label: 'Custom action', name: 'customAction' }],
        onAccessibilityAction,
      },
      staleChannelState: true,
    });

    act(() => {
      fireEvent(getByTestId('message-flat-list'), 'scroll', {
        nativeEvent: {
          contentOffset: { y: 1900 },
          contentSize: { height: 2000, width: 200 },
          layoutMeasurement: { height: 400, width: 200 },
        },
      });
    });

    await waitFor(() => {
      expect(getByTestId('message-flat-list').props.accessibilityActions).toEqual(
        expect.arrayContaining([
          { label: 'Custom action', name: 'customAction' },
          expect.objectContaining({
            label: expect.stringContaining('Scroll to bottom'),
            name: SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME,
          }),
        ]),
      );
    });

    act(() => {
      getByTestId('message-flat-list').props.onAccessibilityAction({
        nativeEvent: { actionName: 'customAction' },
      });
    });
    expect(onAccessibilityAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      await getByTestId('message-flat-list').props.onAccessibilityAction({
        nativeEvent: { actionName: SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME },
      });
    });

    expect(loadLatestMessages).toHaveBeenCalledTimes(1);
    expect(onAccessibilityAction).toHaveBeenCalledTimes(1);
  });
});
