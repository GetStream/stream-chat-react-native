import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type {
  Channel as ChannelType,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import { asTimestampNS, Thread as ThreadClass } from 'stream-chat';
import { v5 as uuidv5 } from 'uuid';

import { AttachmentPickerProvider } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { ImageGalleryProvider } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchConnectionChanged from '../../../mock-builders/event/connectionChanged';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage, generateStaticMessage } from '../../../mock-builders/generator/message';
import { generateStaticUser, generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { Chat } from '../../Chat/Chat';
import { MessageComposer } from '../../MessageInput/MessageComposer';
import { MessageList } from '../../MessageList/MessageList';
import { Thread } from '../Thread';

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';

const renderComponent = ({
  chatClient,
  props,
  thread,
}: {
  chatClient: StreamChat;
  props?: Partial<React.ComponentProps<typeof Thread>>;
  thread: ThreadClass;
}) => {
  return render(
    <OverlayProvider>
      <Chat client={chatClient}>
        <Thread thread={thread} {...props}>
          <MessageList />
          <MessageComposer />
        </Thread>
      </Chat>
    </OverlayProvider>,
  );
};

describe('Thread', () => {
  let chatClient: StreamChat;
  let channel: ChannelType;

  beforeEach(async () => {
    const { client: client, channels } = await initiateClientWithChannels();
    chatClient = client;
    channel = channels[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render a new thread', async () => {
    const cid = 'messaging:test-channel';
    const thread = generateMessage({ cid, text: 'Thread Message Text' });
    const parent_id = thread.id;

    const threadResponses = [
      generateMessage({ cid, parent_id, text: 'Response Message Text' }),
      generateMessage({ cid, parent_id }),
      generateMessage({ cid, parent_id }),
    ];

    // Replies are sourced from the thread instance's reply paginator now, so seed a Thread with the
    // replies (mirroring how the constructor seeds from `latest_replies`) instead of writing to the
    // removed channel.state message store. `setItems` publishes the first, complete reply page.
    const threadInstance = new ThreadClass({ channel, client: chatClient, parentMessage: thread });
    threadInstance.messagePaginator.setItems({
      valueOrFactory: threadResponses.map((reply) =>
        channel.state.formatMessage(reply as unknown as MessageResponse),
      ),
      isFirstPage: true,
      isLastPage: true,
    });

    renderComponent({ chatClient, thread: threadInstance });

    const { getAllByText, getByText, queryByText } = screen;

    await waitFor(() => {
      expect(getByText('Also send to channel')).toBeTruthy();
      expect(getAllByText('Response Message Text')).toHaveLength(1);
      expect(queryByText('Thread2 Message Text')).toBeFalsy();
    });
  }, 10000);

  it('should match thread snapshot', async () => {
    const cid = 'messaging:test-channel';
    const i18nInstance = new Streami18n();
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(3);
    const thread = generateStaticMessage(
      'Message3',
      { cid, reply_count: 3, user: user2 },
      '2020-05-05T14:50:00.000Z',
    );
    const parent_id = thread.id;

    const threadResponses = [
      generateStaticMessage(
        'Message4',
        { cid, parent_id, user: user1 },
        '2020-05-05T14:50:00.000Z',
      ),
      generateStaticMessage(
        'Message5',
        { cid, parent_id, user: user2 },
        '2020-05-05T14:50:00.000Z',
      ),
      generateStaticMessage(
        'Message6',
        { cid, parent_id, user: user1 },
        '2020-05-05T14:50:00.000Z',
      ),
    ];

    const mockedChannel = generateChannelResponse({
      channel: {
        id: uuidv5('Channel', StreamReactNativeNamespace),
      },
      members: [generateMember({ user: user1 }), generateMember({ user: user1 })],
      messages: [
        generateStaticMessage('Message1', { cid, user: user1 }, '2020-05-05T14:48:00.000Z'),
        generateStaticMessage('Message2', { cid, user: user2 }, '2020-05-05T14:49:00.000Z'),
        thread,
        ...threadResponses,
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID2' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.query();

    const threadInstance = new ThreadClass({ channel, client: chatClient, parentMessage: thread });
    threadInstance.messagePaginator.setItems({
      valueOrFactory: threadResponses.map((reply) =>
        channel.state.formatMessage(reply as unknown as MessageResponse),
      ),
      isFirstPage: true,
      isLastPage: true,
    });

    const { getByText, toJSON } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <AttachmentPickerProvider
          value={
            {
              closePicker: jest.fn(),
              openPicker: jest.fn(),
            } as unknown as React.ComponentProps<typeof AttachmentPickerProvider>['value']
          }
        >
          <ImageGalleryProvider
            value={{} as React.ComponentProps<typeof ImageGalleryProvider>['value']}
          >
            <Thread thread={threadInstance}>
              <MessageList />
              <MessageComposer />
            </Thread>
          </ImageGalleryProvider>
        </AttachmentPickerProvider>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByText('Message4')).toBeTruthy();
      expect(getByText('Message5')).toBeTruthy();
      expect(getByText('Message6')).toBeTruthy();
    });

    act(() => {
      channel.messagePaginator.unreadStateSnapshot.next({
        firstUnreadMessageId: null,
        lastReadAt: null,
        lastReadMessageId: null,
        unreadCount: 0,
      });
    });

    const snapshot = toJSON() as unknown as {
      children: Array<{
        children: Array<{ children: Array<{ props: { ListFooterComponent: unknown } }> }>;
      }>;
    };
    snapshot.children[0].children[0].children[0].props.ListFooterComponent = null;

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  // Metadata (parent, read state, participants) comes with a queried page. A thread `ensure` builds for a
  // parent that has replies has only that parent, so it starts stale and reloads once on open; one that
  // already has its data doesn't.
  // An activation that is never released keeps the thread active for the session, so recovery
  // keeps reloading it and it keeps being read automatically.
  it('releases its activation of the thread on unmount', async () => {
    const parentMessage = generateMessage({ cid: 'messaging:test-channel', text: 'Parent' });
    const threadInstance = chatClient.threads.ensure({ channel, parentMessage });
    jest.spyOn(threadInstance, 'reload').mockResolvedValue(undefined);
    jest.spyOn(threadInstance.messagePaginator, 'toTail').mockResolvedValue(undefined);
    const { unmount } = renderComponent({ chatClient, thread: threadInstance });
    await waitFor(() => expect(threadInstance.state.getLatestValue().active).toBe(true));

    unmount();
    expect(threadInstance.state.getLatestValue().active).toBe(false);
  });

  describe('metadata reload on open', () => {
    const openThread = (threadInstance: ThreadClass) => {
      const reload = jest.spyOn(threadInstance, 'reload').mockResolvedValue(undefined);
      const toTail = jest
        .spyOn(threadInstance.messagePaginator, 'toTail')
        .mockResolvedValue(undefined);
      renderComponent({ chatClient, thread: threadInstance });
      return { reload, toTail };
    };

    it('reloads a thread ensure built from its parent message', async () => {
      const parentMessage = generateMessage({
        cid: 'messaging:test-channel',
        reply_count: 1,
        text: 'Parent',
      });
      const threadInstance = chatClient.threads.ensure({ channel, parentMessage });
      const { reload } = openThread(threadInstance);

      await waitFor(() => expect(reload).toHaveBeenCalled());
    });

    it('does not fetch the first reply page while that reload is in flight, only if it fails', async () => {
      const parentMessage = generateMessage({
        cid: 'messaging:test-channel',
        reply_count: 1,
        text: 'Parent',
      });
      const threadInstance = chatClient.threads.ensure({ channel, parentMessage });
      let failReload: () => void = () => undefined;
      jest.spyOn(threadInstance, 'reload').mockImplementation(async () => {
        threadInstance.state.partialNext({ isLoading: true });
        await new Promise<void>((resolve) => (failReload = resolve));
        threadInstance.state.partialNext({ isLoading: false });
      });
      const toTail = jest
        .spyOn(threadInstance.messagePaginator, 'toTail')
        .mockResolvedValue(undefined);
      renderComponent({ chatClient, thread: threadInstance });

      await waitFor(() => expect(threadInstance.reload).toHaveBeenCalled());
      expect(toTail).not.toHaveBeenCalled();

      // The reload ended without seeding replies (a failure): the first page is fetched instead.
      await act(async () => {
        failReload();
        await Promise.resolve();
      });
      await waitFor(() => expect(toTail).toHaveBeenCalled());
    });

    it('does not reload a thread that already has its data', async () => {
      const parentMessage = generateMessage({
        cid: 'messaging:test-channel',
        reply_count: 1,
        text: 'Parent',
      });
      const threadInstance = new ThreadClass({ channel, client: chatClient, parentMessage });
      // the thread list's query hydrates what it lists, so a listed thread isn't stale
      threadInstance.state.partialNext({ isStateStale: false });
      act(() => {
        chatClient.threads.paginator.setItems({
          isFirstPage: true,
          isLastPage: true,
          valueOrFactory: [threadInstance],
        });
      });
      const { reload, toTail } = openThread(threadInstance);

      // The first-page fetch runs from the same mount, so its call marks the effects as settled.
      await waitFor(() => expect(toTail).toHaveBeenCalled());
      expect(reload).not.toHaveBeenCalled();
    });
  });

  describe('reply query errors', () => {
    const makeThread = () => {
      const cid = 'messaging:test-channel';
      const parentMessage = generateMessage({ cid, text: 'Parent' });
      const threadInstance = new ThreadClass({
        channel,
        client: chatClient,
        parentMessage,
      });
      return threadInstance;
    };

    it('renders the error indicator when the reply query failed and nothing loaded', async () => {
      const threadInstance = makeThread();
      // A failed first page leaves `items` undefined, and the error belongs to the THREAD's paginator.
      jest
        .spyOn(threadInstance.messagePaginator, 'toTail')
        .mockRejectedValue(new Error('replies boom'));
      act(() => {
        threadInstance.messagePaginator.state.partialNext({
          lastQueryError: new Error('replies boom'),
        });
      });

      renderComponent({ chatClient, thread: threadInstance });

      await waitFor(() => {
        expect(screen.getByTestId('loading-error')).toBeTruthy();
      });
    });

    it('retries the reply query — and only the reply query — from the indicator', async () => {
      const threadInstance = makeThread();
      const toTail = jest
        .spyOn(threadInstance.messagePaginator, 'toTail')
        .mockRejectedValue(new Error('replies boom'));
      const channelToTail = jest.spyOn(channel.messagePaginator, 'toTail');
      act(() => {
        threadInstance.messagePaginator.state.partialNext({
          lastQueryError: new Error('replies boom'),
        });
      });

      renderComponent({ chatClient, thread: threadInstance });

      const indicator = await waitFor(() => screen.getByTestId('loading-error'));
      // Clear AFTER mount: the mount's own first-page fetch is not what this asserts.
      toTail.mockClear();
      channelToTail.mockClear();

      await act(async () => {
        fireEvent.press(indicator);
        await Promise.resolve();
      });

      expect(toTail).toHaveBeenCalledTimes(1);
      expect(channelToTail).not.toHaveBeenCalled();
    });

    it('does not refetch in a loop while the query is failing', async () => {
      const threadInstance = makeThread();
      // The first-page effect reruns whenever `isLoading` settles back to false. Without the
      // `lastQueryError` guard it would refetch forever and the indicator could never stay up.
      const toTail = jest
        .spyOn(threadInstance.messagePaginator, 'toTail')
        .mockImplementation(() => {
          threadInstance.messagePaginator.state.partialNext({
            isLoading: false,
            lastQueryError: new Error('replies boom'),
          });
          return Promise.resolve();
        });

      renderComponent({ chatClient, thread: threadInstance });

      await waitFor(() => {
        expect(screen.getByTestId('loading-error')).toBeTruthy();
      });
      expect(toTail).toHaveBeenCalledTimes(1);
    });

    it('keeps the reply list when a later query fails but replies are already loaded', async () => {
      const threadInstance = makeThread();
      act(() => {
        threadInstance.messagePaginator.setItems({
          valueOrFactory: [
            channel.state.formatMessage(
              generateMessage({
                cid: 'messaging:test-channel',
                parent_id: threadInstance.id,
                text: 'Loaded reply',
              }) as unknown as MessageResponse,
            ),
          ],
          isFirstPage: true,
          isLastPage: true,
        });
        threadInstance.messagePaginator.state.partialNext({
          lastQueryError: new Error('replies boom'),
        });
      });

      renderComponent({ chatClient, thread: threadInstance });

      await waitFor(() => {
        expect(screen.getByText('Loaded reply')).toBeTruthy();
      });
      expect(screen.queryByTestId('loading-error')).toBeNull();
    });
  });
});

describe('Thread lifecycle', () => {
  const user = generateUser({ id: 'id', name: 'name' });
  let chatClient: StreamChat;

  const openThread = (threadInstance: ThreadClass, children?: React.ReactNode) =>
    render(
      <Chat client={chatClient}>
        <Thread thread={threadInstance}>{children}</Thread>
      </Chat>,
    );

  const watchChannel = async (
    overrides: Partial<Parameters<typeof generateChannelResponse>[0]> = {},
  ) => {
    const mockedChannel = generateChannelResponse({
      messages: [generateMessage({})],
      ...overrides,
    });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const testChannel = chatClient.channel('messaging', mockedChannel.channel.id);
    await testChannel.watch();
    return testChannel;
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(user);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('exposes its thread to its children through the thread context', async () => {
    const testChannel = await watchChannel();
    const threadInstance = new ThreadClass({
      channel: testChannel,
      client: chatClient,
      parentMessage: testChannel.state.formatMessage(generateMessage({ user })),
    });
    jest.spyOn(threadInstance, 'reload').mockResolvedValue(undefined);
    jest.spyOn(threadInstance.messagePaginator, 'toTail').mockResolvedValue(undefined);
    const seen = jest.fn();
    const Probe = () => {
      seen(useThreadContext().thread);
      return null;
    };

    openThread(threadInstance, <Probe />);

    await waitFor(() => expect(seen).toHaveBeenCalledWith(threadInstance));
  });

  // Regression guard for the reconnect refresh of an OPEN THREAD's replies, which runs entirely in
  // `client.connectionRecovery`; this component's only part is marking the thread active.
  //
  // Asserted end to end on purpose: a thread constructed directly (not through
  // `client.threads.ensure`) reaches the LLC's thread store only through `threadInstance.activate()`.
  // Drop that effect and recovery silently skips the thread with nothing else failing.
  it('reloads an open thread on reconnect', async () => {
    const testChannel = await watchChannel();
    const threadInstance = new ThreadClass({
      channel: testChannel,
      client: chatClient,
      parentMessage: testChannel.state.formatMessage(generateMessage({ user })),
    });
    const reload = jest.spyOn(threadInstance, 'reload').mockResolvedValue(undefined);
    // Seed loaded-but-empty replies so the mount-time metadata reload and first-page fetch are
    // skipped, keeping the spy clean for the reconnect-driven call.
    act(() => threadInstance.messagePaginator.state.partialNext({ items: [], isLoading: false }));

    openThread(threadInstance);

    // Activation registers the instance without putting it in the thread list. (Cleared anyway so
    // this can only pass on a reconnect-driven call.)
    await waitFor(() => {
      expect(chatClient.threads.get(threadInstance.id)).toBe(threadInstance);
      expect(threadInstance.state.getLatestValue().active).toBe(true);
    });
    expect(chatClient.threads.paginator.getItem(threadInstance.id)).toBeUndefined();
    reload.mockClear();

    act(() => dispatchConnectionChanged(chatClient, false));
    act(() => dispatchConnectionChanged(chatClient));

    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  // Reads are the LLC's job: the thread's active auto-read marks it once its read state says it has
  // unread replies. `<Thread>` makes no mark-read call of its own.
  describe('read on open', () => {
    const setup = async () => {
      const testChannel = await watchChannel();
      const markRead = jest
        .spyOn(testChannel, 'markRead')
        .mockResolvedValue({} as Awaited<ReturnType<typeof testChannel.markRead>>);
      const parentMessage = testChannel.state.formatMessage(
        generateMessage({ reply_count: 3, user }),
      );
      const readState = (unreadMessageCount: number) => ({
        [chatClient.userID as string]: {
          lastReadAt: 1,
          unreadMessageCount,
          user: { id: chatClient.userID as string },
        },
      });
      return { markRead, parentMessage, readState, testChannel };
    };

    it('marks a thread with unread replies read exactly once, and a read one not at all', async () => {
      const { markRead, parentMessage, readState, testChannel } = await setup();
      const read = new ThreadClass({ channel: testChannel, client: chatClient, parentMessage });
      read.state.partialNext({ read: readState(0) } as never);
      jest.spyOn(read, 'reload').mockResolvedValue(undefined);
      const { unmount } = openThread(read);
      await waitFor(() => expect(read.state.getLatestValue().active).toBe(true));
      expect(markRead).not.toHaveBeenCalled();
      unmount();

      const unread = new ThreadClass({
        channel: testChannel,
        client: chatClient,
        parentMessage: { ...parentMessage, id: `${parentMessage.id}-2` },
      });
      unread.state.partialNext({ read: readState(2) } as never);
      jest.spyOn(unread, 'reload').mockResolvedValue(undefined);
      openThread(unread);

      await waitFor(() => expect(markRead).toHaveBeenCalledWith({ thread_id: unread.id }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(markRead).toHaveBeenCalledTimes(1);
    });

    it('marks a thread ensure() built read once its reload brings the read state', async () => {
      const { markRead, parentMessage, readState, testChannel } = await setup();
      const threadInstance = chatClient.threads.ensure({ channel: testChannel, parentMessage });
      jest.spyOn(threadInstance, 'reload').mockImplementation(() => {
        threadInstance.state.partialNext({ isStateStale: false, read: readState(2) } as never);
        return Promise.resolve();
      });

      openThread(threadInstance);

      await waitFor(() => expect(markRead).toHaveBeenCalledWith({ thread_id: threadInstance.id }));
      expect(markRead).toHaveBeenCalledTimes(1);
    });

    // Opening a thread used to run the channel's own open sequence, which marked the CHANNEL read.
    it('does not mark the channel read when a thread of an unread channel opens', async () => {
      const otherUser = generateUser();
      const testChannel = await watchChannel({
        members: [generateMember({ user }), generateMember({ user: otherUser })],
        messages: [generateMessage({ user: otherUser }), generateMessage({ user: otherUser })],
        read: [{ last_read: asTimestampNS(1), unread_messages: 2, user }],
      });
      const markRead = jest
        .spyOn(testChannel, 'markRead')
        .mockResolvedValue({} as Awaited<ReturnType<typeof testChannel.markRead>>);
      const threadInstance = new ThreadClass({
        channel: testChannel,
        client: chatClient,
        parentMessage: testChannel.state.formatMessage(generateMessage({ user: otherUser })),
      });
      jest.spyOn(threadInstance, 'reload').mockResolvedValue(undefined);
      jest.spyOn(threadInstance.messagePaginator, 'toTail').mockResolvedValue(undefined);

      openThread(threadInstance, <MessageList />);

      await waitFor(() => expect(threadInstance.state.getLatestValue().active).toBe(true));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(markRead.mock.calls.every(([options]) => options?.thread_id)).toBe(true);
    });
  });
});
