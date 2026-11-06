import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { MessagePaginator } from 'stream-chat';

import { useMessageListPagination } from '../useMessageListPagination';

type Deferred = { promise: Promise<void>; reject: (error: Error) => void; resolve: () => void };

const deferred = (): Deferred => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};

// The hook only reads the paging flags and calls toHead/toTail, so a plain object stands in for the
// paginator; `state` only has to satisfy the loading selector.
const makePaginator = ({ hasMoreHead = true, hasMoreTail = true, isLoading = false } = {}) => {
  const paginator = {
    hasMoreHead,
    hasMoreTail,
    isLoading,
    state: {
      getLatestValue: (): { isLoading: boolean; items: unknown[] } => ({
        isLoading: false,
        items: [],
      }),
      subscribeWithSelector: () => () => undefined,
    },
    toHead: jest.fn(() => Promise.resolve()),
    toTail: jest.fn(() => Promise.resolve()),
  };
  return paginator;
};

const render = (paginator: ReturnType<typeof makePaginator>) =>
  renderHook(() => useMessageListPagination(paginator as unknown as MessagePaginator));

describe('useMessageListPagination', () => {
  afterEach(cleanup);

  it('loads older messages and flags loadingMore while the request runs', async () => {
    const paginator = makePaginator();
    const request = deferred();
    paginator.toTail.mockReturnValueOnce(request.promise);
    const { result } = render(paginator);

    let loadMore: Promise<void> | undefined;
    act(() => {
      loadMore = result.current.loadMore();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(paginator.toTail).toHaveBeenCalledTimes(1);
    expect(paginator.toHead).not.toHaveBeenCalled();
    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      request.resolve();
      await loadMore;
    });
    expect(result.current.loadingMore).toBe(false);
  });

  it('loads newer messages and flags loadingMoreRecent while the request runs', async () => {
    const paginator = makePaginator();
    const request = deferred();
    paginator.toHead.mockReturnValueOnce(request.promise);
    const { result } = render(paginator);

    let loadMoreRecent: Promise<void> | undefined;
    act(() => {
      loadMoreRecent = result.current.loadMoreRecent();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(paginator.toHead).toHaveBeenCalledTimes(1);
    expect(result.current.loadingMoreRecent).toBe(true);

    await act(async () => {
      request.resolve();
      await loadMoreRecent;
    });
    expect(result.current.loadingMoreRecent).toBe(false);
  });

  it('does not request an end that has nothing more, or while the paginator is loading', async () => {
    const exhausted = makePaginator({ hasMoreHead: false, hasMoreTail: false });
    const { result: exhaustedResult } = render(exhausted);
    const busy = makePaginator({ isLoading: true });
    const { result: busyResult } = render(busy);

    await act(async () => {
      await exhaustedResult.current.loadMore();
      await exhaustedResult.current.loadMoreRecent();
      await busyResult.current.loadMore();
      await busyResult.current.loadMoreRecent();
    });

    expect(exhausted.toTail).not.toHaveBeenCalled();
    expect(exhausted.toHead).not.toHaveBeenCalled();
    expect(busy.toTail).not.toHaveBeenCalled();
    expect(busy.toHead).not.toHaveBeenCalled();
    expect(exhaustedResult.current.loadingMore).toBe(false);
  });

  it('makes one request for repeated calls in the same direction while one is running', async () => {
    const paginator = makePaginator();
    const request = deferred();
    paginator.toTail.mockReturnValueOnce(request.promise);
    const { result } = render(paginator);

    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });
    await act(async () => {
      request.resolve();
      await first;
    });

    expect(paginator.toTail).toHaveBeenCalledTimes(1);
  });

  it('starts a newer request only once the older one in flight has settled', async () => {
    const paginator = makePaginator();
    const older = deferred();
    paginator.toTail.mockReturnValueOnce(older.promise);
    const { result } = render(paginator);

    let newer: Promise<void> | undefined;
    act(() => {
      result.current.loadMore();
      newer = result.current.loadMoreRecent();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(paginator.toTail).toHaveBeenCalledTimes(1);
    expect(paginator.toHead).not.toHaveBeenCalled();

    await act(async () => {
      older.resolve();
      await newer;
    });
    expect(paginator.toHead).toHaveBeenCalledTimes(1);
  });

  // The lists used to remember every list length they had requested at, so a page that failed left
  // that edge dead until the list length changed.
  it('requests the same end again after a failed request', async () => {
    const paginator = makePaginator();
    paginator.toTail.mockRejectedValueOnce(new Error('network'));
    const { result } = render(paginator);

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.loadingMore).toBe(false);

    await act(async () => {
      await result.current.loadMore();
    });
    expect(paginator.toTail).toHaveBeenCalledTimes(2);
  });

  it('reports loading only while the first page has nothing to show', () => {
    const paginator = makePaginator();
    let value = { isLoading: true, items: [] as unknown[] };
    paginator.state.getLatestValue = () => value;
    const { rerender, result } = render(paginator);
    expect(result.current.loading).toBe(true);

    value = { isLoading: true, items: [{ id: 'a' }] };
    rerender({});
    expect(result.current.loading).toBe(false);
  });
});
