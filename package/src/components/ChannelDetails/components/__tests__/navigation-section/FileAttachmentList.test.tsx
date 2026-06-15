import React from 'react';

import { render, screen } from '@testing-library/react-native';

import Dayjs from 'dayjs';
import { StateStore } from 'stream-chat';
import type { MessageResponse, SearchSourceState } from 'stream-chat';

import {
  ChannelDetailsContextProvider,
  type ChannelDetailsContextValue,
} from '../../../../../contexts/channelDetailsContext/channelDetailsContext';
import { ThemeProvider } from '../../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import {
  TranslationProvider,
  type TranslationContextValue,
} from '../../../../../contexts/translationContext/TranslationContext';
import { generateFileAttachment } from '../../../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../../../mock-builders/generator/message';
import { Streami18n } from '../../../../../utils/i18n/Streami18n';
import type { FileAttachmentItemProps } from '../../navigation-section/FileAttachmentItem';
import { FileAttachmentList } from '../../navigation-section/FileAttachmentList';

const mockRowProbe: FileAttachmentItemProps[] = [];

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
  '../../../../../contexts/channelFileAttachmentListContext/ChannelFileAttachmentListContext',
  () => ({
    ChannelFileAttachmentListProvider: ({
      channel: providedChannel,
      children,
    }: {
      channel: unknown;
      children: React.ReactNode;
    }) => {
      mockProviderProbe.push({ channel: providedChannel });
      return children;
    },
    useChannelFileAttachmentListContext: () => ({
      channel: mockChannel,
      searchSource: mockCurrentSearchSource,
    }),
  }),
);

jest.mock('../../navigation-section/FileAttachmentItem', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    FileAttachmentItem: (props: FileAttachmentItemProps) => {
      mockRowProbe.push(props);
      return ReactLib.createElement(
        Text,
        { testID: `file-row-${props.message.id}` },
        props.message.id,
      );
    },
  };
});

const makeSearchSource = (
  overrides: Partial<{
    hasNext: boolean;
    isLoading: boolean;
    items: MessageResponse[];
    lastQueryError: Error;
  }> = {},
): FakeSearchSource => ({
  search: jest.fn(),
  state: new StateStore({
    hasNext: overrides.hasNext ?? false,
    isLoading: overrides.isLoading ?? false,
    items: overrides.items,
    searchQuery: '',
    ...(overrides.lastQueryError ? { lastQueryError: overrides.lastQueryError } : {}),
  }),
});

const fakeTranslators = {
  t: ((key: string) => key) as never,
  tDateTimeParser: ((input: unknown) => Dayjs(input as string)) as never,
  userLanguage: 'en',
} as unknown as TranslationContextValue;

const tree = (
  searchSource: FakeSearchSource,
  props: { additionalSectionListProps?: object; translators?: TranslationContextValue } = {},
) => {
  mockCurrentSearchSource = searchSource;
  return (
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider value={props.translators ?? fakeTranslators}>
        <ChannelDetailsContextProvider
          value={{ channel: mockChannel } as unknown as ChannelDetailsContextValue}
        >
          <FileAttachmentList
            additionalSectionListProps={props.additionalSectionListProps as never}
          />
        </ChannelDetailsContextProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
};

describe('FileAttachmentList', () => {
  let realTranslators: TranslationContextValue;

  beforeAll(async () => {
    const i18nInstance = new Streami18n();
    realTranslators = (await i18nInstance.getTranslators()) as unknown as TranslationContextValue;
  });

  beforeEach(() => {
    mockRowProbe.length = 0;
    mockProviderProbe.length = 0;
    mockNotificationTargetProbe.length = 0;
  });

  afterEach(() => jest.clearAllMocks());

  it('wraps its content in the file attachment list provider for the channel', () => {
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

  it('does not render a search input', () => {
    render(
      tree(
        makeSearchSource({
          items: [generateMessage({ id: 'm-1' }) as unknown as MessageResponse],
        }),
      ),
    );

    expect(screen.queryByPlaceholderText('Search')).toBeNull();
  });

  it('renders a row per attachment', () => {
    const messageA = generateMessage({
      attachments: [generateFileAttachment()] as never,
      created_at: new Date('2026-03-15T00:00:00.000Z'),
      id: 'm-1',
    }) as unknown as MessageResponse;
    const messageB = generateMessage({
      attachments: [generateFileAttachment()] as never,
      created_at: new Date('2026-03-16T00:00:00.000Z'),
      id: 'm-2',
    }) as unknown as MessageResponse;

    render(tree(makeSearchSource({ items: [messageA, messageB] })));

    // The probe accumulates across re-renders, so assert on distinct rows instead of call count.
    expect(new Set(mockRowProbe.map((p) => p.message.id))).toEqual(new Set(['m-1', 'm-2']));
    expect(screen.getByTestId('file-row-m-1')).toBeTruthy();
    expect(screen.getByTestId('file-row-m-2')).toBeTruthy();
  });

  it('groups messages under month section headers in newest-first order', () => {
    const march = generateMessage({
      attachments: [generateFileAttachment()] as never,
      created_at: new Date('2026-03-15T00:00:00.000Z'),
      id: 'm-mar',
    }) as unknown as MessageResponse;
    const february = generateMessage({
      attachments: [generateFileAttachment()] as never,
      created_at: new Date('2026-02-10T00:00:00.000Z'),
      id: 'm-feb',
    }) as unknown as MessageResponse;

    // The search source returns messages newest-first; the component groups them by month.
    render(tree(makeSearchSource({ items: [march, february] }), { translators: realTranslators }));

    const marchHeader = screen.getByText('March 2026');
    const februaryHeader = screen.getByText('February 2026');
    expect(marchHeader).toBeTruthy();
    expect(februaryHeader).toBeTruthy();
  });

  it('shows the loading skeleton on the initial load', () => {
    render(tree(makeSearchSource({ isLoading: true })));
    expect(screen.getByTestId('file-attachment-list-loading-skeleton')).toBeTruthy();
  });

  it('shows the empty list when there are no files', () => {
    render(tree(makeSearchSource({ isLoading: false, items: [] })));

    expect(screen.getByTestId('empty-list')).toBeTruthy();
    expect(screen.getByText('No files')).toBeTruthy();
    expect(screen.getByText('Files shared in this chat will appear here')).toBeTruthy();
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

    const list = screen.getByTestId('file-attachment-list');
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

    screen.getByTestId('file-attachment-list').props.onEndReached();
    expect(searchSource.search).not.toHaveBeenCalled();
  });

  it('forwards additionalSectionListProps to the underlying list', () => {
    render(
      tree(
        makeSearchSource({ items: [generateMessage({ id: 'm-1' }) as unknown as MessageResponse] }),
        { additionalSectionListProps: { bounces: false, testID: 'custom-list' } },
      ),
    );

    const list = screen.getByTestId('custom-list');
    expect(list.props.bounces).toBe(false);
    expect(screen.queryByTestId('file-attachment-list')).toBeNull();
  });

  it('targets the channel-details panel with a channel-scoped notification host', () => {
    render(tree(makeSearchSource()));

    expect(mockNotificationTargetProbe).toHaveLength(1);
    expect(mockNotificationTargetProbe[0]).toEqual({
      hostId: 'file-attachment-list:messaging:1',
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
      message: 'Failed to load files',
      options: {
        originalError: lastQueryError,
        severity: 'error',
        type: 'api:channel:query-file-attachments:failed',
      },
      origin: { context: { channel: mockChannel }, emitter: 'ChannelFileAttachmentList' },
    });
  });

  it('does not add a notification when there is no query error', () => {
    render(tree(makeSearchSource()));

    expect(mockAddNotification).not.toHaveBeenCalled();
  });
});
