import React from 'react';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse, UserResponse } from 'stream-chat';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import { ChannelAddMembers } from '../components/ChannelAddMembers';

const buildChannel = (members: ChannelMemberResponse[]): Channel =>
  ({
    cid: 'messaging:test',
    data: { member_count: members.length },
    on: () => ({ unsubscribe: () => undefined }),
    state: {
      members: Object.fromEntries(
        members.map((m) => [m.user?.id ?? m.user_id ?? '', m]).filter(([k]) => Boolean(k)),
      ),
    },
  }) as unknown as Channel;

type QueryUsersMock = jest.Mock<Promise<{ users: UserResponse[] }>, [unknown, unknown, unknown]>;

const renderComponent = ({
  channel,
  onSelectionChange = jest.fn(),
  queryUsers,
  userID = 'me',
}: {
  channel: Channel;
  onSelectionChange?: (users: UserResponse[]) => void;
  queryUsers: QueryUsersMock;
  userID?: string;
}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <AccessibilityProvider value={{ enabled: true }}>
        <TranslationProvider
          value={{
            t: ((key: string, options?: Record<string, unknown>) => {
              if (options && typeof options === 'object') {
                return Object.entries(options).reduce(
                  (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
                  key,
                );
              }
              return key;
            }) as never,
            tDateTimeParser: ((input: unknown) => input) as never,
            userLanguage: 'en',
          }}
        >
          <ChatContext.Provider value={{ client: { queryUsers, userID } } as never}>
            <ChannelDetailsContextProvider value={{ channel }}>
              <ChannelAddMembers onSelectionChange={onSelectionChange} />
            </ChannelDetailsContextProvider>
          </ChatContext.Provider>
        </TranslationProvider>
      </AccessibilityProvider>
    </ThemeProvider>,
  );

describe('ChannelAddMembers', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    warnSpy.mockRestore();
  });

  it('renders the search input and shows a loading indicator while the initial fetch is pending', () => {
    const queryUsers: QueryUsersMock = jest.fn().mockReturnValue(new Promise(() => undefined));
    const channel = buildChannel([]);

    renderComponent({ channel, queryUsers });

    expect(screen.getByTestId('channel-add-members-search-input')).toBeTruthy();
    expect(screen.getByTestId('channel-add-members-loading')).toBeTruthy();
  });

  it('fires an initial queryUsers call on mount with the role filter and pagination opts', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });
    const channel = buildChannel([]);

    renderComponent({ channel, queryUsers });

    await waitFor(() => expect(queryUsers).toHaveBeenCalledTimes(1));
    expect(queryUsers).toHaveBeenCalledWith(
      { role: 'user' },
      { name: 1 },
      expect.objectContaining({ limit: 10, offset: 0, presence: true }),
    );
  });

  it('debounces search and triggers an autocomplete query with the latest value only', async () => {
    jest.useFakeTimers();
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });
    const channel = buildChannel([]);

    renderComponent({ channel, queryUsers });

    // Initial mount fetch (no autocomplete filter)
    await act(async () => {
      await Promise.resolve();
    });

    const input = screen.getByTestId('channel-add-members-search-input');
    fireEvent.changeText(input, 'E');
    fireEvent.changeText(input, 'Et');
    fireEvent.changeText(input, 'Eth');

    // Before debounce fires, only the initial mount call should exist.
    expect(queryUsers).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });

    const autocompleteCalls = queryUsers.mock.calls.filter(
      ([filter]) => (filter as { name?: unknown })?.name !== undefined,
    );
    expect(autocompleteCalls).toHaveLength(1);
    expect(autocompleteCalls[0][0]).toEqual({
      name: { $autocomplete: 'Eth' },
      role: 'user',
    });
  });

  it('filters out existing channel members from the rendered list', async () => {
    const existingUser = generateUser({ id: 'u-1', name: 'Existing Member' });
    const newUser = generateUser({ id: 'u-2', name: 'New User' });
    const channel = buildChannel([generateMember({ user: existingUser })]);
    const queryUsers: QueryUsersMock = jest
      .fn()
      .mockResolvedValue({ users: [existingUser, newUser] });

    renderComponent({ channel, queryUsers });

    await waitFor(() => expect(screen.queryByTestId('channel-add-members-row-u-2')).toBeTruthy());
    expect(screen.queryByTestId('channel-add-members-row-u-1')).toBeNull();
  });

  it('filters out the current user from the rendered list', async () => {
    const me = generateUser({ id: 'me', name: 'Me' });
    const newUser = generateUser({ id: 'u-2', name: 'New User' });
    const channel = buildChannel([]);
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [me, newUser] });

    renderComponent({ channel, queryUsers, userID: 'me' });

    await waitFor(() => expect(screen.queryByTestId('channel-add-members-row-u-2')).toBeTruthy());
    expect(screen.queryByTestId('channel-add-members-row-me')).toBeNull();
  });

  it('toggles selection on the row and reflects it via accessibilityState', async () => {
    const newUser = generateUser({ id: 'u-2', name: 'New User' });
    const channel = buildChannel([]);
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [newUser] });

    renderComponent({ channel, queryUsers });

    const row = await waitFor(() => screen.getByTestId('channel-add-members-row-u-2'));
    expect(row.props.accessibilityState).toMatchObject({ selected: false });

    fireEvent.press(row);
    expect(
      screen.getByTestId('channel-add-members-row-u-2').props.accessibilityState,
    ).toMatchObject({ selected: true });

    fireEvent.press(screen.getByTestId('channel-add-members-row-u-2'));
    expect(
      screen.getByTestId('channel-add-members-row-u-2').props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it('emits onSelectionChange with the latest selection on toggle', async () => {
    const newUser = generateUser({ id: 'u-2', name: 'New User' });
    const channel = buildChannel([]);
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [newUser] });
    const onSelectionChange = jest.fn();

    renderComponent({ channel, onSelectionChange, queryUsers });

    const row = await waitFor(() => screen.getByTestId('channel-add-members-row-u-2'));
    fireEvent.press(row);

    await waitFor(() =>
      expect(onSelectionChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'u-2' })]),
    );

    fireEvent.press(row);
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith([]));
  });

  it('renders the empty state when queryUsers returns no users', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });
    const channel = buildChannel([]);

    renderComponent({ channel, queryUsers });

    await waitFor(() => expect(screen.getByTestId('channel-add-members-empty')).toBeTruthy());
    expect(screen.getByText('No user found')).toBeTruthy();
  });

  it('renders the clear-search button only when search text is non-empty', async () => {
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: [] });
    const channel = buildChannel([]);

    renderComponent({ channel, queryUsers });

    expect(screen.queryByTestId('channel-add-members-clear-search')).toBeNull();

    fireEvent.changeText(screen.getByTestId('channel-add-members-search-input'), 'X');
    expect(screen.getByTestId('channel-add-members-clear-search')).toBeTruthy();

    fireEvent.press(screen.getByTestId('channel-add-members-clear-search'));
    await waitFor(() =>
      expect(screen.queryByTestId('channel-add-members-clear-search')).toBeNull(),
    );
  });

  it('keeps the selection when the search text changes', async () => {
    jest.useFakeTimers();
    const userA = generateUser({ id: 'u-2', name: 'New User' });
    const userB = generateUser({ id: 'u-3', name: 'Other User' });
    const channel = buildChannel([]);
    const queryUsers: QueryUsersMock = jest
      .fn()
      .mockResolvedValueOnce({ users: [userA, userB] })
      .mockResolvedValueOnce({ users: [userA] });

    const onSelectionChange = jest.fn();
    renderComponent({ channel, onSelectionChange, queryUsers });

    await act(async () => {
      await Promise.resolve();
    });

    const row = screen.getByTestId('channel-add-members-row-u-2');
    fireEvent.press(row);
    expect(onSelectionChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'u-2' })]);

    fireEvent.changeText(screen.getByTestId('channel-add-members-search-input'), 'New');
    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(onSelectionChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'u-2' })]);
    expect(
      screen.getByTestId('channel-add-members-row-u-2').props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it('wires onEndReached on the list so it can request additional pages', async () => {
    const firstPage = Array.from({ length: 10 }, (_, i) =>
      generateUser({ id: `p1-${i}`, name: `User P1 ${i}` }),
    );
    const channel = buildChannel([]);
    const queryUsers: QueryUsersMock = jest.fn().mockResolvedValue({ users: firstPage });

    renderComponent({ channel, queryUsers });

    await waitFor(() => expect(screen.getByTestId('channel-add-members-row-p1-0')).toBeTruthy());

    const list = screen.getByTestId('channel-add-members-list');
    expect(typeof list.props.onEndReached).toBe('function');
    expect(list.props.onEndReachedThreshold).toBe(0.2);
  });
});
