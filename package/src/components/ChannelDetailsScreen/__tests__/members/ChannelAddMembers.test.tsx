import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Channel, UserResponse } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateUser } from '../../../../mock-builders/generator/user';
import type { AddMemberSearchResultItemProps } from '../../components/members/AddMemberSearchResultItem';
import { ChannelAddMembers } from '../../components/members/ChannelAddMembers';
import {
  type UseChannelAddMembersResult,
  useChannelAddMembers,
} from '../../hooks/members/useChannelAddMembers';

const mockRowProbe: AddMemberSearchResultItemProps[] = [];

jest.mock('../../hooks/members/useChannelAddMembers', () => ({
  useChannelAddMembers: jest.fn(),
}));

jest.mock('../../../UIComponents/SearchInput', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    SearchInput: ({
      onChangeText,
      onClear,
    }: {
      onChangeText: (t: string) => void;
      onClear: () => void;
    }) =>
      ReactLib.createElement(
        ReactLib.Fragment,
        null,
        ReactLib.createElement(
          Text,
          { onPress: () => onChangeText('query'), testID: 'search-change' },
          'change',
        ),
        ReactLib.createElement(Text, { onPress: onClear, testID: 'search-clear' }, 'clear'),
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
        { onPress: props.onPress, testID: `add-member-row-${props.user.id}` },
        props.user.id,
      );
    },
  };
});

const channel = {
  cid: 'messaging:test',
  on: () => ({ unsubscribe: () => undefined }),
} as unknown as Channel;

const baseHookResult = (): UseChannelAddMembersResult => ({
  clearSearch: jest.fn(),
  hasMore: true,
  isSelected: jest.fn(() => false),
  loading: false,
  loadingMore: false,
  loadMore: jest.fn(),
  onChangeSearchText: jest.fn(),
  results: [],
  selectedUsers: [],
  toggleUser: jest.fn(),
});

const mockHook = (overrides: Partial<UseChannelAddMembersResult> = {}) => {
  const value = { ...baseHookResult(), ...overrides };
  (useChannelAddMembers as jest.Mock).mockReturnValue(value);
  return value;
};

const tree = (
  props: {
    onSelectionChange?: (selectedUsers: UserResponse[]) => void;
    additionalFlatListProps?: object;
  } = {},
) => (
  <ThemeProvider theme={defaultTheme}>
    <TranslationProvider
      value={{
        t: ((key: string) => key) as never,
        tDateTimeParser: ((input: unknown) => input) as never,
        userLanguage: 'en',
      }}
    >
      <ChannelDetailsContextProvider value={{ channel }}>
        <ChannelAddMembers
          additionalFlatListProps={props.additionalFlatListProps as never}
          onSelectionChange={props.onSelectionChange ?? jest.fn()}
        />
      </ChannelDetailsContextProvider>
    </TranslationProvider>
  </ThemeProvider>
);

const renderComponent = (
  props: {
    onSelectionChange?: (selectedUsers: UserResponse[]) => void;
    additionalFlatListProps?: object;
  } = {},
) => render(tree(props));

describe('ChannelAddMembers', () => {
  beforeEach(() => {
    mockRowProbe.length = 0;
    mockHook();
  });

  afterEach(() => jest.clearAllMocks());

  it('wires the search input to the hook callbacks', () => {
    const hook = mockHook();
    renderComponent();

    fireEvent.press(screen.getByTestId('search-change'));
    expect(hook.onChangeSearchText).toHaveBeenCalledWith('query');

    fireEvent.press(screen.getByTestId('search-clear'));
    expect(hook.clearSearch).toHaveBeenCalledTimes(1);
  });

  it('renders a row per result and forwards selection/membership flags and toggle handler', () => {
    const userA = generateUser({ id: 'u-1' });
    const userB = generateUser({ id: 'u-2' });
    const isSelected = jest.fn((id: string) => id === 'u-2');
    const toggleUser = jest.fn();
    mockHook({
      isSelected,
      results: [
        { ...userA, isAlreadyMember: true },
        { ...userB, isAlreadyMember: false },
      ],
      toggleUser,
    });

    renderComponent();

    expect(mockRowProbe).toHaveLength(2);
    expect(mockRowProbe[0]).toMatchObject({ isAlreadyMember: true, selected: false });
    expect(mockRowProbe[1]).toMatchObject({ isAlreadyMember: false, selected: true });

    fireEvent.press(screen.getByTestId('add-member-row-u-1'));
    expect(toggleUser).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-1' }));
  });

  it('shows the loading skeleton while loading and the empty state when no results', () => {
    mockHook({ loading: true });
    const { rerender } = renderComponent();
    expect(screen.getByTestId('user-list-loading-skeleton')).toBeTruthy();

    mockHook({ loading: false, results: [] });
    rerender(tree());

    expect(screen.queryByTestId('user-list-loading-skeleton')).toBeNull();
    expect(screen.getByText('No user found')).toBeTruthy();
  });

  it('renders the loading-more indicator only while loadingMore is true', () => {
    mockHook({ loadingMore: true });
    renderComponent();
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('wires onEndReached and the end-reached threshold on the list', () => {
    const loadMore = jest.fn();
    mockHook({ loadMore });
    renderComponent();

    const list = screen.getByTestId('channel-add-members-list');
    expect(list.props.onEndReachedThreshold).toBe(0.2);
    list.props.onEndReached();
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('forwards additionalFlatListProps to the underlying list', () => {
    mockHook();
    renderComponent({ additionalFlatListProps: { bounces: false, testID: 'custom-list' } });

    const list = screen.getByTestId('custom-list');
    expect(list.props.bounces).toBe(false);
    expect(screen.queryByTestId('channel-add-members-list')).toBeNull();
  });

  it('emits onSelectionChange only when the selection reference changes (not on mount)', () => {
    const onSelectionChange = jest.fn();
    const selectionA: never[] = [];
    mockHook({ selectedUsers: selectionA });

    const { rerender } = render(tree({ onSelectionChange }));

    expect(onSelectionChange).not.toHaveBeenCalled();

    const selectionB = [generateUser({ id: 'u-1' })];
    mockHook({ selectedUsers: selectionB as never });
    rerender(tree({ onSelectionChange }));

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(selectionB);
  });
});
