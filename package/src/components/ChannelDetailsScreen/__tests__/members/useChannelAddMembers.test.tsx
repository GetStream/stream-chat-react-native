import React from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Channel, UserResponse } from 'stream-chat';

import { ChatContext } from '../../../../contexts/chatContext/ChatContext';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateUser } from '../../../../mock-builders/generator/user';
import { useChannelMembersState } from '../../../ChannelList/hooks/useChannelMembersState';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';
import { useChannelAddMembers } from '../../hooks/members/useChannelAddMembers';

jest.mock('../../../ChannelList/hooks/useChannelMembersState', () => ({
  useChannelMembersState: jest.fn(() => ({})),
}));

jest.mock('../../../Notifications/hooks/useNotificationApi', () => ({
  useNotificationApi: jest.fn(() => ({ addNotification: jest.fn() })),
}));

type QueryUsersMock = jest.Mock<Promise<{ users: UserResponse[] }>, [unknown, unknown, unknown]>;

const t = ((key: string, options?: Record<string, unknown>) => {
  if (options && typeof options === 'object') {
    return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), key);
  }
  return key;
}) as never;

const channel = { cid: 'messaging:test' } as unknown as Channel;

const buildUsers = (count: number, prefix = 'u') =>
  Array.from({ length: count }, (_, i) =>
    generateUser({ id: `${prefix}-${i}`, name: `User ${i}` }),
  );

const renderUseChannelAddMembers = (queryUsers: QueryUsersMock) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TranslationProvider
      value={{ t, tDateTimeParser: ((input: unknown) => input) as never, userLanguage: 'en' }}
    >
      <ChatContext.Provider value={{ client: { queryUsers } } as never}>
        {children}
      </ChatContext.Provider>
    </TranslationProvider>
  );
  return renderHook(() => useChannelAddMembers({ channel }), { wrapper });
};

describe('useChannelAddMembers', () => {
  let addNotification: jest.Mock;

  beforeEach(() => {
    addNotification = jest.fn();
    (useNotificationApi as jest.Mock).mockReturnValue({ addNotification });
    (useChannelMembersState as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('fetches the first page on mount with the role sort and pagination opts', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: buildUsers(2) });

    const { result } = renderUseChannelAddMembers(queryUsers);

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(queryUsers).toHaveBeenCalledTimes(1));
    expect(queryUsers).toHaveBeenCalledWith({}, { name: 1 }, { limit: 25, offset: 0 });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results.map((u) => u.id)).toEqual(['u-0', 'u-1']);
  });

  it('debounces search and only queries with the latest text', async () => {
    jest.useFakeTimers();
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });

    const { result } = renderUseChannelAddMembers(queryUsers);

    // flush the (non-debounced) mount fetch
    await act(async () => {
      await Promise.resolve();
    });
    expect(queryUsers).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onChangeSearchText('E');
      result.current.onChangeSearchText('Et');
      result.current.onChangeSearchText('Eth');
    });

    // debounce has not fired yet
    expect(queryUsers).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    const autocompleteCalls = queryUsers.mock.calls.filter(
      ([filter]) => (filter as { name?: unknown })?.name !== undefined,
    );
    expect(autocompleteCalls).toHaveLength(1);
    expect(autocompleteCalls[0][0]).toEqual({ name: { $autocomplete: 'Eth' } });
  });

  it('clearSearch cancels the pending debounce and refetches with an empty query', async () => {
    jest.useFakeTimers();
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });

    const { result } = renderUseChannelAddMembers(queryUsers);
    await act(async () => {
      await Promise.resolve();
    });

    act(() => result.current.onChangeSearchText('abc'));
    act(() => result.current.clearSearch());

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    // mount fetch + clearSearch fetch, both with the empty filter; the debounced
    // autocomplete was cancelled so it never ran.
    expect(queryUsers).toHaveBeenCalledTimes(2);
    expect(
      queryUsers.mock.calls.every(([filter]) => Object.keys(filter as object).length === 0),
    ).toBe(true);
  });

  it('appends the next page on loadMore, dedupes by id, and sets hasMore=false on a short page', async () => {
    const firstPage = buildUsers(25, 'page1');
    const overlap = firstPage[firstPage.length - 1];
    const secondPage = [overlap, ...buildUsers(10, 'page2')];
    const queryUsers: QueryUsersMock = jest
      .fn()
      .mockResolvedValueOnce({ users: firstPage })
      .mockResolvedValueOnce({ users: secondPage });

    const { result } = renderUseChannelAddMembers(queryUsers);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toHaveLength(25);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    await waitFor(() => expect(queryUsers).toHaveBeenCalledTimes(2));
    expect(queryUsers).toHaveBeenNthCalledWith(2, {}, { name: 1 }, { limit: 25, offset: 25 });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    // 25 + 10 fresh (the overlapping page1 row is deduped away)
    expect(result.current.results).toHaveLength(35);
    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore is a no-op once hasMore is false', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: buildUsers(10) });

    const { result } = renderUseChannelAddMembers(queryUsers);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.loadMore());
    expect(queryUsers).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale (superseded) response when a newer request has started', async () => {
    let resolveFirst: ((value: { users: UserResponse[] }) => void) | undefined;
    const queryUsers: QueryUsersMock = jest
      .fn()
      .mockReturnValueOnce(
        new Promise<{ users: UserResponse[] }>((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce({ users: buildUsers(1, 'fresh') });

    const { result } = renderUseChannelAddMembers(queryUsers);

    // start a second (newer) request before the first resolves
    act(() => result.current.clearSearch());
    await waitFor(() => expect(result.current.results.map((u) => u.id)).toEqual(['fresh-0']));

    // the stale first response resolves last and must be ignored
    act(() => resolveFirst?.({ users: buildUsers(3, 'stale') }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.results.map((u) => u.id)).toEqual(['fresh-0']);
  });

  it('reports membership via isAlreadyMember from the channel member state', async () => {
    (useChannelMembersState as jest.Mock).mockReturnValue({ 'u-0': { user_id: 'u-0' } });
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: buildUsers(2) });

    const { result } = renderUseChannelAddMembers(queryUsers);

    await waitFor(() => expect(result.current.results).toHaveLength(2));
    expect(result.current.isAlreadyMember('u-0')).toBe(true);
    expect(result.current.isAlreadyMember('u-1')).toBe(false);
  });

  it('toggleUser adds/removes selection and isSelected reflects it', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: buildUsers(1) });

    const { result } = renderUseChannelAddMembers(queryUsers);
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    const user = result.current.results[0];

    act(() => result.current.toggleUser(user));
    expect(result.current.isSelected('u-0')).toBe(true);
    expect(result.current.selectedUsers).toHaveLength(1);

    act(() => result.current.toggleUser(user));
    expect(result.current.isSelected('u-0')).toBe(false);
    expect(result.current.selectedUsers).toHaveLength(0);
  });

  it('toggleUser ignores rows without an id', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });

    const { result } = renderUseChannelAddMembers(queryUsers);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.toggleUser({} as never));

    expect(result.current.selectedUsers).toHaveLength(0);
  });

  it('surfaces an error notification when queryUsers rejects', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockRejectedValue(new Error('boom'));

    const { result } = renderUseChannelAddMembers(queryUsers);

    await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          severity: 'error',
          type: 'api:channel:query-users:failed',
        }),
      }),
    );
    expect(result.current.loading).toBe(false);
  });

  it('cancels the pending debounced search on unmount', async () => {
    jest.useFakeTimers();
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });

    const { result, unmount } = renderUseChannelAddMembers(queryUsers);
    await act(async () => {
      await Promise.resolve();
    });

    act(() => result.current.onChangeSearchText('abc'));
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    // only the mount fetch ran; the debounced autocomplete was cancelled on unmount
    expect(queryUsers).toHaveBeenCalledTimes(1);
  });
});
