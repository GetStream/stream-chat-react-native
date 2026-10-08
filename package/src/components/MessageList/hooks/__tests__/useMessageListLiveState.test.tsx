import { AppState } from 'react-native';

import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, MessagePaginator, StreamChat } from 'stream-chat';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import dispatchMessageNewEvent from '../../../../mock-builders/event/messageNew';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { useMessageListLiveState } from '../useMessageListLiveState';

const asMessages = (ids: string[]) => ids.map((id) => ({ id })) as LocalMessage[];

// A thread's reply paginator, reduced to what the hook touches.
const makeThreadPaginator = () => ({
  setViewingLive: jest.fn(),
  state: { getLatestValue: () => ({ hasMoreHead: false, items: asMessages(['r1', 'r2']) }) },
});

describe('useMessageListLiveState', () => {
  let client: StreamChat;
  let channel: Channel;

  // The react-native jest preset leaves `currentState` a mock function rather than a state string.
  const originalAppState = AppState.currentState;

  beforeEach(async () => {
    Object.assign(AppState, { currentState: 'active' });
    client = await getTestClientWithUser({ id: 'me' });
    const response = generateChannelResponse({
      messages: [generateMessage({ id: 'm1', user: generateUser({ id: 'other' }) })],
    });
    useMockedApis(client, [getOrCreateChannelApi(response)]);
    channel = client.channel('messaging', response.channel.id);
    await channel.watch();
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    Object.assign(AppState, { currentState: originalAppState });
  });

  it('reports whether the newest message is on screen to the channel paginator', () => {
    const { result } = renderHook(() =>
      useMessageListLiveState({
        channel,
        markRead: jest.fn(),
        paginator: channel.messagePaginator,
        threadList: false,
        userId: 'me',
      }),
    );
    const newestId = channel.messagePaginator.state.getLatestValue().items?.at(-1)?.id as string;

    act(() => result.current(asMessages([newestId])));
    expect(channel.messagePaginator.isViewingLive).toBe(true);

    act(() => result.current(asMessages(['not-the-newest'])));
    expect(channel.messagePaginator.isViewingLive).toBe(false);
  });

  it('stops reporting the channel as viewed live when the list unmounts', () => {
    const { result, unmount } = renderHook(() =>
      useMessageListLiveState({
        channel,
        markRead: jest.fn(),
        paginator: channel.messagePaginator,
        threadList: false,
        userId: 'me',
      }),
    );
    const newestId = channel.messagePaginator.state.getLatestValue().items?.at(-1)?.id as string;
    act(() => result.current(asMessages([newestId])));

    unmount();

    expect(channel.messagePaginator.isViewingLive).toBe(false);
  });

  // A thread opened over the channel used to write the channel's flag, so the channel stayed "not
  // live" after the thread closed and counted the next message as unread while the user sat at the
  // bottom.
  it("reports a thread list to the thread's paginator and leaves the channel's flag alone", () => {
    act(() => channel.messagePaginator.setViewingLive(true));
    const threadPaginator = makeThreadPaginator();

    const { result, unmount } = renderHook(() =>
      useMessageListLiveState({
        channel,
        markRead: jest.fn(),
        paginator: threadPaginator as unknown as MessagePaginator,
        threadList: true,
        userId: 'me',
      }),
    );
    act(() => result.current(asMessages(['r2'])));
    expect(threadPaginator.setViewingLive).toHaveBeenLastCalledWith(true);

    act(() => result.current(asMessages(['r1'])));
    expect(threadPaginator.setViewingLive).toHaveBeenLastCalledWith(false);

    unmount();
    expect(channel.messagePaginator.isViewingLive).toBe(true);
  });

  it('marks the channel read when a message arrives while it is viewed live', () => {
    const markRead = jest.fn();
    renderHook(() =>
      useMessageListLiveState({
        channel,
        markRead,
        paginator: channel.messagePaginator,
        threadList: false,
        userId: 'me',
      }),
    );
    act(() => channel.messagePaginator.setViewingLive(true));

    act(() =>
      dispatchMessageNewEvent(
        client,
        generateMessage({ cid: channel.cid, user: generateUser({ id: 'other' }) }),
        channel.data as never,
      ),
    );

    expect(markRead).toHaveBeenCalledTimes(1);
  });

  it('leaves marking the channel read to the channel list when it is a thread list', () => {
    const markRead = jest.fn();
    renderHook(() =>
      useMessageListLiveState({
        channel,
        markRead,
        paginator: makeThreadPaginator() as unknown as MessagePaginator,
        threadList: true,
        userId: 'me',
      }),
    );
    act(() => channel.messagePaginator.setViewingLive(true));

    act(() =>
      dispatchMessageNewEvent(
        client,
        generateMessage({ cid: channel.cid, user: generateUser({ id: 'other' }) }),
        channel.data as never,
      ),
    );

    expect(markRead).not.toHaveBeenCalled();
  });
});
