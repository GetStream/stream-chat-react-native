import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage } from 'stream-chat';

import { useMessageListPagination } from '../hooks/useMessageListPagination';

// NOTE: `stream-chat` is portaled during this migration; a runtime (value) import of it breaks
// jest resolution. Everything from `stream-chat` here is a type-only import, and the paginator is
// faked, so no runtime `require('stream-chat')` happens.

jest.mock('../../Notifications', () => ({
  useNotificationApi: () => ({ addNotification: jest.fn() }),
}));
jest.mock('../../../contexts/translationContext/TranslationContext', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

type PaginatorStateValue = {
  hasMoreHead: boolean;
  hasMoreTail: boolean;
  isLoading: boolean;
  items?: LocalMessage[];
};

const makeStore = <T,>(value: T) => ({
  getLatestValue: () => value,
  subscribeWithSelector: () => () => {},
});

const makePaginator = (state: PaginatorStateValue, focusedMessageId?: string) => ({
  hasMoreHead: state.hasMoreHead,
  hasMoreTail: state.hasMoreTail,
  jumpToMessage: jest.fn().mockResolvedValue(true),
  jumpToTheFirstUnreadMessage: jest.fn().mockResolvedValue(true),
  jumpToTheLatestMessage: jest.fn().mockResolvedValue(true),
  messageFocusSignal: makeStore({
    signal: focusedMessageId ? { messageId: focusedMessageId } : null,
  }),
  state: makeStore(state),
  toHead: jest.fn().mockResolvedValue(undefined),
  toTail: jest.fn().mockResolvedValue(undefined),
});

const makeChannel = (paginator: ReturnType<typeof makePaginator>) =>
  ({ messagePaginator: paginator }) as unknown as Channel;

describe('useMessageListPagination', () => {
  afterEach(cleanup);

  it('maps paginator state (tailward/older→hasMore, headward/newer→hasMoreNewer, items→messages)', () => {
    const items = [{ id: 'a' }, { id: 'b' }] as unknown as LocalMessage[];
    const paginator = makePaginator({
      hasMoreHead: false,
      hasMoreTail: true,
      isLoading: false,
      items,
    });
    const { result } = renderHook(() =>
      useMessageListPagination({ channel: makeChannel(paginator) }),
    );
    expect(result.current.state.messages).toBe(items);
    expect(result.current.state.hasMore).toBe(true);
    expect(result.current.state.hasMoreNewer).toBe(false);
  });

  it('loadMore (older) delegates to paginator.toTail()', async () => {
    const paginator = makePaginator({
      hasMoreHead: true,
      hasMoreTail: true,
      isLoading: false,
      items: [],
    });
    const { result } = renderHook(() =>
      useMessageListPagination({ channel: makeChannel(paginator) }),
    );
    await act(async () => {
      await result.current.loadMore();
    });
    expect(paginator.toTail).toHaveBeenCalledTimes(1);
    expect(paginator.toHead).not.toHaveBeenCalled();
  });

  it('loadMoreRecent (newer) delegates to paginator.toHead()', async () => {
    const paginator = makePaginator({
      hasMoreHead: true,
      hasMoreTail: true,
      isLoading: false,
      items: [],
    });
    const { result } = renderHook(() =>
      useMessageListPagination({ channel: makeChannel(paginator) }),
    );
    await act(async () => {
      await result.current.loadMoreRecent();
    });
    expect(paginator.toHead).toHaveBeenCalledTimes(1);
    expect(paginator.toTail).not.toHaveBeenCalled();
  });

  it('does not paginate when the paginator has no more in the requested direction', async () => {
    const paginator = makePaginator({
      hasMoreHead: false,
      hasMoreTail: false,
      isLoading: false,
      items: [],
    });
    const { result } = renderHook(() =>
      useMessageListPagination({ channel: makeChannel(paginator) }),
    );
    await act(async () => {
      await result.current.loadMore();
      await result.current.loadMoreRecent();
    });
    expect(paginator.toTail).not.toHaveBeenCalled();
    expect(paginator.toHead).not.toHaveBeenCalled();
  });

  it('loadLatestMessages delegates to paginator.jumpToTheLatestMessage()', async () => {
    const paginator = makePaginator({
      hasMoreHead: true,
      hasMoreTail: true,
      isLoading: false,
      items: [],
    });
    const { result } = renderHook(() =>
      useMessageListPagination({ channel: makeChannel(paginator) }),
    );
    await act(async () => {
      await result.current.loadLatestMessages();
    });
    expect(paginator.jumpToTheLatestMessage).toHaveBeenCalledTimes(1);
  });

  it('loadChannelAroundMessage jumps to the message (emitting the focus signal)', async () => {
    const paginator = makePaginator({
      hasMoreHead: true,
      hasMoreTail: true,
      isLoading: false,
      items: [],
    });
    const { result } = renderHook(() =>
      useMessageListPagination({ channel: makeChannel(paginator) }),
    );
    await act(async () => {
      await result.current.loadChannelAroundMessage({ messageId: 'm7' });
    });
    expect(paginator.jumpToMessage).toHaveBeenCalledWith(
      'm7',
      expect.objectContaining({ focusReason: 'jump-to-message' }),
    );
  });

  it('loadChannelAtFirstUnreadMessage jumps to first unread (emitting the focus signal)', async () => {
    const paginator = makePaginator(
      { hasMoreHead: true, hasMoreTail: true, isLoading: false, items: [] },
      'm5',
    );
    const { result } = renderHook(() =>
      useMessageListPagination({ channel: makeChannel(paginator) }),
    );
    await act(async () => {
      await result.current.loadChannelAtFirstUnreadMessage();
    });
    expect(paginator.jumpToTheFirstUnreadMessage).toHaveBeenCalledTimes(1);
  });
});
