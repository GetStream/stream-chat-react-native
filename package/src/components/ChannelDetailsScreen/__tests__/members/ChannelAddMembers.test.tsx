import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StateStore } from 'stream-chat';
import type { SearchSourceState, UserResponse } from 'stream-chat';

import { ChannelAddMembersContext } from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateUser } from '../../../../mock-builders/generator/user';
import { SelectionStore } from '../../../../state-store/selection-store';
import type { AddMemberSearchResultItemProps } from '../../components/members/AddMemberSearchResultItem';
import { ChannelAddMembers } from '../../components/members/ChannelAddMembers';

const mockRowProbe: AddMemberSearchResultItemProps[] = [];

const mockAddNotification = jest.fn();

jest.mock('../../../Notifications/hooks/useNotificationApi', () => ({
  useNotificationApi: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('../../../UIComponents/SearchInput', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    SearchInput: ({ onChangeText }: { onChangeText: (t: string) => void }) =>
      ReactLib.createElement(
        ReactLib.Fragment,
        null,
        ReactLib.createElement(
          Text,
          { onPress: () => onChangeText('query'), testID: 'search-change' },
          'change',
        ),
        ReactLib.createElement(
          Text,
          { onPress: () => onChangeText(''), testID: 'search-clear' },
          'clear',
        ),
      ),
  };
});

jest.mock('../../components/members/AddMemberSearchResultItem', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    AddMemberSearchResultItem: (props: AddMemberSearchResultItemProps) => {
      mockRowProbe.push(props);
      return ReactLib.createElement(
        Text,
        { onPress: () => props.onPress(props.user), testID: `add-member-row-${props.user.id}` },
        props.user.id,
      );
    },
  };
});

type FakeSearchSource = {
  resetState: jest.Mock;
  search: jest.Mock;
  state: StateStore<
    Pick<SearchSourceState<UserResponse>, 'hasNext' | 'isLoading' | 'items' | 'lastQueryError'>
  >;
};

const makeSearchSource = (
  overrides: Partial<{
    hasNext: boolean;
    isLoading: boolean;
    items: UserResponse[];
    lastQueryError: Error;
  }> = {},
): FakeSearchSource => ({
  resetState: jest.fn(),
  search: jest.fn(),
  state: new StateStore({
    hasNext: overrides.hasNext ?? false,
    isLoading: overrides.isLoading ?? false,
    items: overrides.items,
    ...(overrides.lastQueryError ? { lastQueryError: overrides.lastQueryError } : {}),
  }),
});

const tree = (
  searchSource: FakeSearchSource,
  selectionStore: SelectionStore,
  props: { additionalFlatListProps?: object } = {},
) => (
  <ThemeProvider theme={defaultTheme}>
    <TranslationProvider
      value={{
        t: ((key: string) => key) as never,
        tDateTimeParser: ((input: unknown) => input) as never,
        userLanguage: 'en',
      }}
    >
      <ChannelAddMembersContext.Provider value={{ searchSource, selectionStore } as never}>
        <ChannelAddMembers additionalFlatListProps={props.additionalFlatListProps as never} />
      </ChannelAddMembersContext.Provider>
    </TranslationProvider>
  </ThemeProvider>
);

describe('ChannelAddMembers', () => {
  beforeEach(() => {
    mockRowProbe.length = 0;
  });

  afterEach(() => jest.clearAllMocks());

  it('wires the search input to the search source callbacks', () => {
    const searchSource = makeSearchSource();
    render(tree(searchSource, new SelectionStore()));

    fireEvent.press(screen.getByTestId('search-change'));
    expect(searchSource.search).toHaveBeenCalledWith('query');

    fireEvent.press(screen.getByTestId('search-clear'));
    expect(searchSource.resetState).toHaveBeenCalledTimes(1);
  });

  it('renders a row per result and selects the user on press', () => {
    const userA = generateUser({ id: 'u-1' });
    const userB = generateUser({ id: 'u-2' });
    const selectionStore = new SelectionStore();

    render(tree(makeSearchSource({ items: [userA, userB] }), selectionStore));

    expect(mockRowProbe).toHaveLength(2);
    expect(mockRowProbe.map((p) => p.user.id)).toEqual(['u-1', 'u-2']);

    fireEvent.press(screen.getByTestId('add-member-row-u-1'));
    expect(selectionStore.state.getLatestValue().selectedIds.has('u-1')).toBe(true);
  });

  it('shows the loading skeleton while loading and the empty state when no results', () => {
    const { rerender } = render(tree(makeSearchSource({ isLoading: true }), new SelectionStore()));
    expect(screen.getByTestId('user-list-loading-skeleton')).toBeTruthy();

    rerender(tree(makeSearchSource({ isLoading: false, items: [] }), new SelectionStore()));

    expect(screen.queryByTestId('user-list-loading-skeleton')).toBeNull();
    expect(screen.getByText('No user found')).toBeTruthy();
  });

  it('renders the loading-more indicator only while loading with existing results', () => {
    render(
      tree(
        makeSearchSource({ isLoading: true, items: [generateUser({ id: 'alice' })] }),
        new SelectionStore(),
      ),
    );
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('loads more via the search source when the list end is reached and there is a next page', () => {
    const searchSource = makeSearchSource({ hasNext: true });
    render(tree(searchSource, new SelectionStore()));
    searchSource.search.mockClear();

    const list = screen.getByTestId('channel-add-members-list');
    expect(list.props.onEndReachedThreshold).toBe(0.2);
    list.props.onEndReached();
    expect(searchSource.search).toHaveBeenCalledTimes(1);
  });

  it('does not load more when there is no next page', () => {
    const searchSource = makeSearchSource({ hasNext: false });
    render(tree(searchSource, new SelectionStore()));
    searchSource.search.mockClear();

    screen.getByTestId('channel-add-members-list').props.onEndReached();
    expect(searchSource.search).not.toHaveBeenCalled();
  });

  it('dispatches an error notification when the user search fails', () => {
    const lastQueryError = new Error('boom');
    render(tree(makeSearchSource({ lastQueryError }), new SelectionStore()));

    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to load users',
        options: expect.objectContaining({
          severity: 'error',
          type: 'api:channel:query-users:failed',
        }),
        origin: expect.objectContaining({ emitter: 'AddChannelMembers' }),
      }),
    );
  });

  it('does not dispatch an error notification when the search succeeds', () => {
    render(tree(makeSearchSource({ items: [generateUser({ id: 'u-1' })] }), new SelectionStore()));

    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('forwards additionalFlatListProps to the underlying list', () => {
    render(
      tree(makeSearchSource(), new SelectionStore(), {
        additionalFlatListProps: { bounces: false, testID: 'custom-list' },
      }),
    );

    const list = screen.getByTestId('custom-list');
    expect(list.props.bounces).toBe(false);
    expect(screen.queryByTestId('channel-add-members-list')).toBeNull();
  });
});
