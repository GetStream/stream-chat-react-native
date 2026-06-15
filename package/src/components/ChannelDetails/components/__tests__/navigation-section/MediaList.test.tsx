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
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../../../mock-builders/generator/message';
import type { MediaItemProps } from '../../navigation-section/MediaItem';
import { MediaList } from '../../navigation-section/MediaList';

const mockTileProbe: MediaItemProps[] = [];

const mockOpenImageGallery = jest.fn();
const mockImageGalleryStateStore = { openImageGallery: mockOpenImageGallery };
const mockSetOverlay = jest.fn();
const mockIsVideoPlayerAvailable = jest.fn(() => true);
const mockOpenUrlSafely = jest.fn();

jest.mock('../../../../../contexts/imageGalleryContext/ImageGalleryContext', () => ({
  ...jest.requireActual('../../../../../contexts/imageGalleryContext/ImageGalleryContext'),
  useImageGalleryContext: () => ({ imageGalleryStateStore: mockImageGalleryStateStore }),
}));

jest.mock('../../../../../contexts/overlayContext/OverlayContext', () => ({
  ...jest.requireActual('../../../../../contexts/overlayContext/OverlayContext'),
  useOverlayContext: () => ({ setOverlay: mockSetOverlay }),
}));

jest.mock('../../../../../native', () => ({
  ...jest.requireActual('../../../../../native'),
  isVideoPlayerAvailable: () => mockIsVideoPlayerAvailable(),
}));

jest.mock('../../../../Attachment/utils/openUrlSafely', () => ({
  openUrlSafely: (...args: unknown[]) => mockOpenUrlSafely(...args),
}));

type FakeSearchSource = {
  search: jest.Mock;
  state: StateStore<
    Pick<SearchSourceState<MessageResponse>, 'hasNext' | 'isLoading' | 'items' | 'lastQueryError'>
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

jest.mock('../../../../../contexts/channelMediaListContext/ChannelMediaListContext', () => {
  const actual = jest.requireActual(
    '../../../../../contexts/channelMediaListContext/ChannelMediaListContext',
  );
  const ReactLib = require('react');
  return {
    ...actual,
    // Inject a fake search source through the real context so MediaListContent can read it via
    // the real `useChannelMediaListContext`.
    ChannelMediaListProvider: ({
      channel: providedChannel,
      children,
    }: {
      channel: unknown;
      children: React.ReactNode;
    }) => {
      mockProviderProbe.push({ channel: providedChannel });
      return ReactLib.createElement(
        actual.ChannelMediaListContext.Provider,
        { value: { channel: mockChannel, searchSource: mockCurrentSearchSource } },
        children,
      );
    },
  };
});

jest.mock('../../navigation-section/MediaItem', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    MediaItem: (props: MediaItemProps) => {
      mockTileProbe.push(props);
      // Mirror production: the tile receives its press handler from the list via `renderItem`.
      return ReactLib.createElement(
        Text,
        {
          onPress: () =>
            props.onPress?.({
              attachment: props.attachment,
              message: props.message,
              requesterNode: 123,
            }),
          testID: 'media-tile',
        },
        `${props.message.id}-${props.attachment.type}`,
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
          <MediaList additionalFlatListProps={props.additionalFlatListProps as never} />
        </ChannelDetailsContextProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
};

const messageWithAttachments = (id: string, attachments: unknown[]) =>
  generateMessage({ attachments: attachments as never, id }) as unknown as MessageResponse;

describe('MediaList', () => {
  beforeEach(() => {
    mockTileProbe.length = 0;
    mockProviderProbe.length = 0;
    mockNotificationTargetProbe.length = 0;
    mockIsVideoPlayerAvailable.mockReturnValue(true);
  });

  afterEach(() => jest.clearAllMocks());

  it('wraps its content in the media list provider for the channel', () => {
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

  it('renders one tile per media attachment returned by the search source', () => {
    const messageA = messageWithAttachments('m-1', [
      generateImageAttachment(),
      generateVideoAttachment(),
    ]);

    render(tree(makeSearchSource({ items: [messageA] })));

    const tiles = screen.getAllByTestId('media-tile');
    expect(tiles.map((tile) => tile.props.children)).toEqual(['m-1-image', 'm-1-video']);
  });

  it('opens the fullscreen gallery over all loaded media when an image tile is pressed', () => {
    const attachment = generateImageAttachment({ image_url: 'https://example.com/a.jpg' });
    const messageA = messageWithAttachments('m-1', [attachment]);
    const messageB = messageWithAttachments('m-2', [generateImageAttachment()]);

    render(tree(makeSearchSource({ items: [messageA, messageB] })));

    fireEvent.press(screen.getAllByTestId('media-tile')[0]);

    expect(mockOpenImageGallery).toHaveBeenCalledTimes(1);
    const callArgs = mockOpenImageGallery.mock.calls[0][0];
    expect(callArgs.selectedAttachmentUrl).toBe('https://example.com/a.jpg');
    expect(callArgs.requesterNode).toBe(123);
    expect(callArgs.messages.map((m: MessageResponse) => m.id)).toEqual(['m-1', 'm-2']);
    expect(mockSetOverlay).toHaveBeenCalledWith('gallery');
  });

  it('opens the video URL instead of the gallery when no video player is available', () => {
    mockIsVideoPlayerAvailable.mockReturnValue(false);
    const attachment = generateVideoAttachment({ asset_url: 'https://example.com/v.mp4' });
    const messageA = messageWithAttachments('m-1', [attachment]);

    render(tree(makeSearchSource({ items: [messageA] })));

    fireEvent.press(screen.getAllByTestId('media-tile')[0]);

    expect(mockOpenUrlSafely).toHaveBeenCalledWith('https://example.com/v.mp4');
    expect(mockOpenImageGallery).not.toHaveBeenCalled();
    expect(mockSetOverlay).not.toHaveBeenCalled();
  });

  it('shows the loading skeleton on the initial load', () => {
    render(tree(makeSearchSource({ isLoading: true })));
    expect(screen.getByTestId('media-list-loading-skeleton')).toBeTruthy();
  });

  it('shows the empty state when there is no media', () => {
    render(tree(makeSearchSource({ isLoading: false, items: [] })));

    expect(screen.getByTestId('empty-list')).toBeTruthy();
    expect(screen.getByText('No media')).toBeTruthy();
    expect(screen.getByText('Photos and videos sent in this chat will appear here')).toBeTruthy();
  });

  it('renders the loading-more indicator only while loading with existing results', () => {
    render(
      tree(
        makeSearchSource({
          isLoading: true,
          items: [messageWithAttachments('m-1', [generateImageAttachment()])],
        }),
      ),
    );
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('loads more via the search source when the list end is reached and there is a next page', () => {
    const searchSource = makeSearchSource({
      hasNext: true,
      items: [messageWithAttachments('m-1', [generateImageAttachment()])],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    const list = screen.getByTestId('media-list');
    expect(list.props.onEndReachedThreshold).toBe(0.2);
    list.props.onEndReached();
    expect(searchSource.search).toHaveBeenCalledTimes(1);
  });

  it('does not load more when there is no next page', () => {
    const searchSource = makeSearchSource({
      hasNext: false,
      items: [messageWithAttachments('m-1', [generateImageAttachment()])],
    });
    render(tree(searchSource));
    searchSource.search.mockClear();

    screen.getByTestId('media-list').props.onEndReached();
    expect(searchSource.search).not.toHaveBeenCalled();
  });

  it('forwards additionalFlatListProps to the underlying list', () => {
    render(
      tree(
        makeSearchSource({ items: [messageWithAttachments('m-1', [generateImageAttachment()])] }),
        {
          additionalFlatListProps: { bounces: false, testID: 'custom-list' },
        },
      ),
    );

    const list = screen.getByTestId('custom-list');
    expect(list.props.bounces).toBe(false);
    expect(screen.queryByTestId('media-list')).toBeNull();
  });

  it('targets the channel-details panel with a channel-scoped notification host', () => {
    render(tree(makeSearchSource()));

    expect(mockNotificationTargetProbe).toHaveLength(1);
    expect(mockNotificationTargetProbe[0]).toEqual({
      hostId: 'media-list:messaging:1',
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
      message: 'Failed to load media',
      options: {
        originalError: lastQueryError,
        severity: 'error',
        type: 'api:channel:query-media:failed',
      },
      origin: { context: { channel: mockChannel }, emitter: 'ChannelMediaList' },
    });
  });

  it('does not add a notification when there is no query error', () => {
    render(tree(makeSearchSource()));

    expect(mockAddNotification).not.toHaveBeenCalled();
  });
});
