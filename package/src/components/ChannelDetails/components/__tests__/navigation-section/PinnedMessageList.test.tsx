import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StateStore } from 'stream-chat';
import type { MessageResponse, SearchSourceState } from 'stream-chat';

import {
  ChannelDetailsContextProvider,
  type ChannelDetailsContextValue,
} from '../../../../../contexts/channelDetailsContext/channelDetailsContext';
import { ThemeProvider } from '../../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../../contexts/translationContext/TranslationContext';
import { generateMessage } from '../../../../../mock-builders/generator/message';
import type { PinnedMessageItemProps } from '../../navigation-section/PinnedMessageItem';
import { PinnedMessageList } from '../../navigation-section/PinnedMessageList';

const mockRowProbe: PinnedMessageItemProps[] = [];

type FakeSearchSource = {
  search: jest.Mock;
  state: StateStore<
    Pick<
      SearchSourceState<MessageResponse>,
      'hasNext' | 'isLoading' | 'items' | 'lastQueryError' | 'searchQuery'
    >
  >;
};

const mockChannel = { cid: 'messaging:1' };
let mockCurrentSearchSource: FakeSearchSource;
const mockProviderProbe: { channel: unknown }[] = [];
const mockNotificationTargetProbe: { hostId?: string; panel?: string }[] = [];
const mockAddNotification = jest.fn();

jest.mock('../../../../Notifications/hooks/useNotificationApi', () => ({
  useNotificationApi: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('../../../../Notifications/NotificationTargetContext', () => ({
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

jest.mock('../../../../Notifications/NotificationList', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    NotificationList: () => ReactLib.createElement(View, { testID: 'notification-list' }),
  };
});

jest.mock(
  '../../../../../contexts/channelPinnedMessageListContext/ChannelPinnedMessageListContext',
  () => ({
    ChannelPinnedMessageListProvider: ({
      channel: providedChannel,
      children,
    }: {
      channel: unknown;
      children: React.ReactNode;
    }) => {
      mockProviderProbe.push({ channel: providedChannel });
      return children;
    },
    useChannelPinnedMessageListContext: () => ({
      channel: mockChannel,
      searchSource: mockCurrentSearchSource,
    }),
  }),
);

jest.mock('../../navigation-section/PinnedMessageItem', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    PinnedMessageItem: (props: PinnedMessageItemProps) => {
      mockRowProbe.push(props);
      return ReactLib.createElement(
        Text,
        { testID: `pinned-row-${props.message.id}` },
        props.message.id,
      );
    },
  };
});

jest.mock('../../../../UIComponents/SearchInput', () => {
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

const makeSearchSource = (
  overrides: Partial<{
    hasNext: boolean;
    isLoading: boolean;
    items: MessageResponse[];
    lastQueryError: Error;
    searchQuery: string;
  }> = {},
): FakeSearchSource => ({
  search: jest.fn(),
  state: new StateStore({
    hasNext: overrides.hasNext ?? false,
    isLoading: overrides.isLoading ?? false,
    items: overrides.items,
    searchQuery: overrides.searchQuery ?? '',
    ...(overrides.lastQueryError ? { lastQueryError: overrides.lastQueryError } : {}),
  }),
});

const tree = (searchSource: FakeSearchSource, props: { additionalFlatListProps?: object } = {}) => {
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
          value={{ channel: mockChannel } as unknown as ChannelDetailsContextValue}
        >
          <PinnedMessageList additionalFlatListProps={props.additionalFlatListProps as never} />
        </ChannelDetailsContextProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
};

describe('PinnedMessageList', () => {
  beforeEach(() => {
    mockRowProbe.length = 0;
    mockProviderProbe.length = 0;
    mockNotificationTargetProbe.length = 0;
  });

  afterEach(() => jest.clearAllMocks());

  it('wraps its content in the pinned message list provider for the channel', () => {
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
      items: [generateMessage({ id: 'm-1' }) as unknown as MessageResponse],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    fireEvent.press(screen.getByTestId('search-change'));
    expect(searchSource.search).toHaveBeenCalledWith('query');

    fireEvent.press(screen.getByTestId('search-clear'));
    expect(searchSource.search).toHaveBeenCalledWith('');
  });

  it('renders a row per pinned message and forwards the channel', () => {
    const messageA = generateMessage({ id: 'm-1' }) as unknown as MessageResponse;
    const messageB = generateMessage({ id: 'm-2' }) as unknown as MessageResponse;

    render(tree(makeSearchSource({ items: [messageA, messageB] })));

    expect(mockRowProbe).toHaveLength(2);
    expect(mockRowProbe.map((p) => p.message.id)).toEqual(['m-1', 'm-2']);
    expect(mockRowProbe[0].channel).toBe(mockChannel);
    expect(screen.getByTestId('pinned-row-m-1')).toBeTruthy();
  });

  it('shows the loading skeleton and keeps the search bar on the initial load', () => {
    render(tree(makeSearchSource({ isLoading: true })));
    expect(screen.getByTestId('pinned-message-list-loading-skeleton')).toBeTruthy();
    expect(screen.getByTestId('search-change')).toBeTruthy();
  });

  it('shows the empty list and hides the search bar when there are no pins and no query', () => {
    render(tree(makeSearchSource({ isLoading: false, items: [], searchQuery: '' })));

    expect(screen.getByTestId('empty-list')).toBeTruthy();
    expect(screen.getByText('No pinned messages')).toBeTruthy();
    expect(screen.getByText('Long-press a message to pin it to the chat')).toBeTruthy();
    expect(screen.queryByTestId('search-change')).toBeNull();
  });

  it('shows the empty search result and keeps the search bar when a query returns no results', () => {
    render(tree(makeSearchSource({ isLoading: false, items: [], searchQuery: 'query' })));

    expect(screen.getByTestId('empty-search-result')).toBeTruthy();
    expect(screen.getByText('No pinned messages')).toBeTruthy();
    expect(screen.queryByTestId('empty-list')).toBeNull();
    expect(screen.getByTestId('search-change')).toBeTruthy();
  });

  it('renders the loading-more indicator only while loading with existing results', () => {
    render(
      tree(
        makeSearchSource({
          isLoading: true,
          items: [generateMessage({ id: 'm-1' }) as unknown as MessageResponse],
        }),
      ),
    );
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('loads more via the search source when the list end is reached and there is a next page', () => {
    const searchSource = makeSearchSource({
      hasNext: true,
      items: [generateMessage({ id: 'm-1' }) as unknown as MessageResponse],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    const list = screen.getByTestId('pinned-message-list');
    expect(list.props.onEndReachedThreshold).toBe(0.2);
    list.props.onEndReached();
    expect(searchSource.search).toHaveBeenCalledTimes(1);
  });

  it('does not load more when there is no next page', () => {
    const searchSource = makeSearchSource({
      hasNext: false,
      items: [generateMessage({ id: 'm-1' }) as unknown as MessageResponse],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    screen.getByTestId('pinned-message-list').props.onEndReached();
    expect(searchSource.search).not.toHaveBeenCalled();
  });

  it('forwards additionalFlatListProps to the underlying list', () => {
    render(
      tree(
        makeSearchSource({ items: [generateMessage({ id: 'm-1' }) as unknown as MessageResponse] }),
        {
          additionalFlatListProps: { bounces: false, testID: 'custom-list' },
        },
      ),
    );

    const list = screen.getByTestId('custom-list');
    expect(list.props.bounces).toBe(false);
    expect(screen.queryByTestId('pinned-message-list')).toBeNull();
  });

  it('targets the channel-details panel with a channel-scoped notification host', () => {
    render(tree(makeSearchSource()));

    expect(mockNotificationTargetProbe).toHaveLength(1);
    expect(mockNotificationTargetProbe[0]).toEqual({
      hostId: 'pinned-message-list:messaging:1',
      panel: 'channel-details',
    });
  });

  it('renders the notification list host', () => {
    render(tree(makeSearchSource()));

    expect(screen.getByTestId('notification-list')).toBeTruthy();
  });

  it('adds an error notification when the search source reports a query error', () => {
    const lastQueryError = new Error('boom');
    render(tree(makeSearchSource({ lastQueryError })));

    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Failed to load pinned messages',
      options: {
        originalError: lastQueryError,
        severity: 'error',
        type: 'api:channel:query-pinned-messages:failed',
      },
      origin: { context: { channel: mockChannel }, emitter: 'ChannelPinnedMessageList' },
    });
  });

  it('does not add a notification when there is no query error', () => {
    render(tree(makeSearchSource()));

    expect(mockAddNotification).not.toHaveBeenCalled();
  });
});
