import React from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StateStore } from 'stream-chat';
import type { ChannelMemberResponse, SearchSourceState } from 'stream-chat';

import {
  ChannelDetailsContextProvider,
  type ChannelDetailsContextValue,
} from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { WithComponents } from '../../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import type { ChannelMemberActionsSheetProps } from '../../components/members/ChannelMemberActionsSheet';
import type { ChannelMemberItemProps } from '../../components/members/ChannelMemberItem';
import { ChannelMemberList } from '../../components/members/ChannelMemberList';

const mockItemProbe: ChannelMemberItemProps[] = [];
const mockSheetProbe: ChannelMemberActionsSheetProps[] = [];

const mockChannel = { cid: 'messaging:1' };
let mockCurrentSearchSource: FakeSearchSource;
const mockProviderProbe: { channel: unknown }[] = [];
const mockNotificationTargetProbe: { hostId?: string; panel?: string }[] = [];
const mockAddNotification = jest.fn();

jest.mock('../../../Notifications/hooks/useNotificationApi', () => ({
  useNotificationApi: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('../../../Notifications/NotificationTargetContext', () => ({
  NotificationTargetProvider: ({
    children,
    hostId,
    panel,
  }: {
    children: React.ReactNode;
    hostId?: string;
    panel?: string;
  }) => {
    mockNotificationTargetProbe.push({ hostId, panel });
    return children;
  },
}));

jest.mock('../../../Notifications/NotificationList', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    NotificationList: () => ReactLib.createElement(View, { testID: 'notification-list' }),
  };
});

jest.mock('../../../../contexts/channelMemberListContext/ChannelMemberListContext', () => ({
  ChannelMemberListProvider: ({
    channel: providedChannel,
    children,
  }: {
    channel: unknown;
    children: React.ReactNode;
  }) => {
    mockProviderProbe.push({ channel: providedChannel });
    return children;
  },
  useChannelMemberListContext: () => ({
    channel: mockChannel,
    searchSource: mockCurrentSearchSource,
  }),
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

type FakeSearchSource = {
  search: jest.Mock;
  state: StateStore<
    Pick<
      SearchSourceState<ChannelMemberResponse>,
      'hasNext' | 'isLoading' | 'items' | 'lastQueryError' | 'searchQuery'
    >
  > & { partialNext: jest.Mock };
};

const makeSearchSource = (
  overrides: Partial<{
    hasNext: boolean;
    isLoading: boolean;
    items: ChannelMemberResponse[];
    lastQueryError: Error;
    searchQuery: string;
  }> = {},
): FakeSearchSource => {
  const state = new StateStore({
    hasNext: overrides.hasNext ?? false,
    isLoading: overrides.isLoading ?? false,
    items: overrides.items,
    searchQuery: overrides.searchQuery ?? '',
    ...(overrides.lastQueryError ? { lastQueryError: overrides.lastQueryError } : {}),
  });
  // The component calls state.partialNext on search input change; spy on it.
  jest.spyOn(state, 'partialNext');
  return {
    search: jest.fn(),
    state: state as FakeSearchSource['state'],
  };
};

const MemberItemProbe = (props: ChannelMemberItemProps) => {
  const { Text } = require('react-native');
  mockItemProbe.push(props);
  return (
    <Text onPress={() => props.onPress?.(props.member)} testID={`member-${props.member.user?.id}`}>
      {props.member.user?.id}
    </Text>
  );
};

const MemberActionsSheetProbe = (props: ChannelMemberActionsSheetProps) => {
  const { Text } = require('react-native');
  mockSheetProbe.push(props);
  return <Text testID='member-actions-sheet-probe'>{props.member.user?.id ?? ''}</Text>;
};

const tree = (
  searchSource: FakeSearchSource,
  props: {
    additionalFlatListProps?: object;
    onMemberPress?: (member: ChannelMemberResponse) => void;
  } = {},
) => {
  mockCurrentSearchSource = searchSource;
  return (
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChannelDetailsContextProvider
          value={
            {
              channel: mockChannel,
              onMemberPress: props.onMemberPress,
            } as unknown as ChannelDetailsContextValue
          }
        >
          <WithComponents
            overrides={{
              ChannelMemberActionsSheet: MemberActionsSheetProbe,
              ChannelMemberItem: MemberItemProbe,
            }}
          >
            <ChannelMemberList additionalFlatListProps={props.additionalFlatListProps as never} />
          </WithComponents>
        </ChannelDetailsContextProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
};

describe('ChannelMemberList', () => {
  beforeEach(() => {
    mockItemProbe.length = 0;
    mockSheetProbe.length = 0;
    mockProviderProbe.length = 0;
    mockNotificationTargetProbe.length = 0;
  });

  afterEach(() => jest.clearAllMocks());

  it('wraps its content in the member list provider for the channel', () => {
    render(tree(makeSearchSource()));

    expect(mockProviderProbe).toHaveLength(1);
    expect(mockProviderProbe[0].channel).toBe(mockChannel);
  });

  it('calls search when the component is created', () => {
    const searchSource = makeSearchSource();
    render(tree(searchSource));

    expect(searchSource.search).toHaveBeenCalledTimes(1);
    expect(searchSource.search).toHaveBeenCalledWith();
  });

  it('wires the search input to the search source callbacks', () => {
    const searchSource = makeSearchSource({
      items: [generateMember({ user: generateUser({ id: 'alice' }) })],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    fireEvent.press(screen.getByTestId('search-change'));
    expect(searchSource.state.partialNext).toHaveBeenCalledWith({ searchQuery: 'query' });
    expect(searchSource.search).toHaveBeenCalledWith('query');

    fireEvent.press(screen.getByTestId('search-clear'));
    expect(searchSource.search).toHaveBeenCalledWith('');
  });

  it('renders a row per member and forwards a stable keyExtractor', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });

    render(tree(makeSearchSource({ items: [alice, bob] })));

    expect(mockItemProbe.map((p) => p.member.user?.id)).toEqual(['alice', 'bob']);
    expect(screen.getByTestId('member-alice')).toBeTruthy();
    expect(screen.getByTestId('channel-member-list').props.keyExtractor(alice, 0)).toBe('alice');
  });

  it('shows the loading skeleton and keeps the search bar on the initial load', () => {
    render(tree(makeSearchSource({ isLoading: true })));

    expect(screen.getByTestId('member-list-loading-skeleton')).toBeTruthy();
    expect(screen.getByTestId('search-change')).toBeTruthy();
  });

  it('shows the empty search result and keeps the search bar when there are no results', () => {
    render(tree(makeSearchSource({ isLoading: false, items: [] })));

    expect(screen.getByTestId('empty-search-result')).toBeTruthy();
    expect(screen.getByText('No members found')).toBeTruthy();
    expect(screen.getByTestId('search-change')).toBeTruthy();
  });

  it('renders the loading-more indicator only while loading with existing results', () => {
    render(
      tree(
        makeSearchSource({
          isLoading: true,
          items: [generateMember({ user: generateUser({ id: 'alice' }) })],
        }),
      ),
    );
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('loads more via the search source when the list end is reached and there is a next page', () => {
    const searchSource = makeSearchSource({
      hasNext: true,
      items: [generateMember({ user: generateUser({ id: 'alice' }) })],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    const list = screen.getByTestId('channel-member-list');
    expect(list.props.onEndReachedThreshold).toBe(0.2);
    list.props.onEndReached();
    expect(searchSource.search).toHaveBeenCalledTimes(1);
  });

  it('does not load more when there is no next page', () => {
    const searchSource = makeSearchSource({
      hasNext: false,
      items: [generateMember({ user: generateUser({ id: 'alice' }) })],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    screen.getByTestId('channel-member-list').props.onEndReached();
    expect(searchSource.search).not.toHaveBeenCalled();
  });

  it('forwards additionalFlatListProps to the underlying list', () => {
    render(
      tree(makeSearchSource({ items: [generateMember({ user: generateUser({ id: 'alice' }) })] }), {
        additionalFlatListProps: { bounces: false, testID: 'custom-list' },
      }),
    );

    const list = screen.getByTestId('custom-list');
    expect(list.props.bounces).toBe(false);
    expect(screen.queryByTestId('channel-member-list')).toBeNull();
  });

  it('opens the per-member actions sheet on press when no onMemberPress override is provided, and closes it', () => {
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });
    render(tree(makeSearchSource({ items: [bob] })));

    expect(screen.queryByTestId('member-actions-sheet-probe')).toBeNull();

    fireEvent.press(screen.getByTestId('member-bob'));
    expect(screen.getByTestId('member-actions-sheet-probe').props.children).toBe('bob');

    act(() => mockSheetProbe[mockSheetProbe.length - 1]?.onClose?.());
    expect(screen.queryByTestId('member-actions-sheet-probe')).toBeNull();
  });

  it('calls onMemberPress instead of opening the sheet when an override is provided', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const onMemberPress = jest.fn();
    render(tree(makeSearchSource({ items: [alice] }), { onMemberPress }));

    fireEvent.press(screen.getByTestId('member-alice'));

    expect(onMemberPress).toHaveBeenCalledTimes(1);
    expect(onMemberPress.mock.calls[0][0].user?.id).toBe('alice');
    expect(screen.queryByTestId('member-actions-sheet-probe')).toBeNull();
  });

  it('targets the channel-details panel with a channel-scoped notification host', () => {
    render(tree(makeSearchSource()));

    expect(mockNotificationTargetProbe).toHaveLength(1);
    expect(mockNotificationTargetProbe[0]).toEqual({
      hostId: 'channel-member-list:messaging:1',
      panel: 'channel-details',
    });
  });

  it('renders the notification list host', () => {
    render(tree(makeSearchSource({ items: [] })));

    expect(screen.getByTestId('notification-list')).toBeTruthy();
  });

  it('adds an error notification when the search source reports a query error', () => {
    const lastQueryError = new Error('boom');
    render(tree(makeSearchSource({ lastQueryError })));

    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Failed to load members',
      options: {
        originalError: lastQueryError,
        severity: 'error',
        type: 'api:channel:query-members:failed',
      },
      origin: { context: { channel: mockChannel }, emitter: 'ChannelMemberList' },
    });
  });

  it('does not add a notification when there is no query error', () => {
    render(tree(makeSearchSource({ items: [] })));

    expect(mockAddNotification).not.toHaveBeenCalled();
  });
});
