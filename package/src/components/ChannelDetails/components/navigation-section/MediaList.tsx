import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, type FlatListProps, StyleSheet, View } from 'react-native';

import {
  formatMessage,
  type MessageResponse,
  type MessageSearchSource,
  type SearchSourceState,
} from 'stream-chat';

import { type MediaItemPressParams } from './MediaItem';
import { getNumberOfColumns, MEDIA_GRID_GAP } from './mediaListColumns';
import { MediaListLoadingSkeleton } from './MediaListLoadingSkeleton';
import { useGridScrollAnchor } from './useGridScrollAnchor';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelMediaListProvider,
  useChannelMediaListContext,
} from '../../../../contexts/channelMediaListContext/ChannelMediaListContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useImageGalleryContext } from '../../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useOverlayContext } from '../../../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { getNotificationErrorOptions } from '../../../../hooks/actions/useChannelActions';
import { useContainerWidth } from '../../../../hooks/useContainerWidth';
import { useStateStore } from '../../../../hooks/useStateStore';
import { isVideoPlayerAvailable } from '../../../../native';
import { FileTypes } from '../../../../types/types';
import { getUrlOfImageAttachment } from '../../../../utils/getUrlOfImageAttachment';
import { openUrlSafely } from '../../../Attachment/utils/openUrlSafely';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';
import { NotificationList } from '../../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { EmptyList } from '../../../UIComponents/EmptyList';
import { type MediaTile, useMediaList } from '../../hooks/useMediaList';

export type MediaListProps = {
  /**
   * Besides the existing default behavior of the media list, you can attach additional props to
   * the underlying React Native FlatList.
   *
   * See https://reactnative.dev/docs/flatlist#props for the full list.
   */
  additionalFlatListProps?: Partial<FlatListProps<MediaTile>>;
  /**
   * A custom `MessageSearchSource` used to query and paginate the media grid.
   * Overrides the source the provider creates by default (pre-configured to
   * fetch image/video attachments, newest first).
   */
  searchSource?: MessageSearchSource;
  /**
   * Number of columns in the media grid. Defaults to a count derived from the width of the grid's
   * own container: 3 on phone widths, more as the container grows. Set this to pin the grid to a
   * fixed column count regardless of width.
   */
  numberOfColumns?: number;
};

const keyExtractor = (item: MediaTile, index: number) => `${item.message.id}-${index}`;

const listStateSelector = (state: SearchSourceState<MessageResponse>) => ({
  error: state.lastQueryError,
  hasNext: state.hasNext,
  loading: state.isLoading,
  messages: state.items,
});

const MediaListContent = ({ additionalFlatListProps, numberOfColumns }: MediaListProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: { mediaList },
    },
  } = useTheme();
  const styles = useStyles();
  const { onLayout, width } = useContainerWidth();
  const { icons, MediaItem } = useComponentsContext();

  const { addNotification } = useNotificationApi();

  const { channel } = useChannelDetailsContext();
  const { searchSource } = useChannelMediaListContext();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { setOverlay } = useOverlayContext();
  const { error, hasNext, loading, messages } = useStateStore(
    searchSource.state,
    listStateSelector,
  );

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      searchSource.search();
    }
  }, [searchSource]);

  const [isEmpty, setIsEmpty] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (!messages || isEmpty !== undefined) {
      return;
    }
    if (messages.length === 0) {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }
  }, [isEmpty, messages]);

  useEffect(() => {
    if (!error) {
      return;
    }
    addNotification({
      message: t('Failed to load media'),
      options: {
        ...getNotificationErrorOptions(error),
        severity: 'error',
        type: 'api:channel:query-media:failed',
      },
      origin: { context: { channel }, emitter: 'ChannelMediaList' },
    });
  }, [error, addNotification, channel, t]);

  const tiles = useMediaList(messages);

  const columns = numberOfColumns ?? getNumberOfColumns(width);

  const tileSize = useMemo(
    () => (width - MEDIA_GRID_GAP * (columns - 1)) / columns,
    [width, columns],
  );

  // Spread after the consumer's props so the anchor keeps working; it still calls their handlers.
  const { listRef, scrollProps } = useGridScrollAnchor<MediaTile>({
    columns,
    itemCount: tiles.length,
    listProps: additionalFlatListProps,
    rowStride: tileSize + MEDIA_GRID_GAP,
  });

  // Opens the fullscreen gallery over the whole loaded collection, selecting the tapped attachment.
  // Mirrors the in-message gallery (`components/Attachment/Gallery.tsx`), but passes every loaded
  // message so the viewer can swipe across all media in the list rather than a single message.
  const handlePressItem = useCallback(
    ({ attachment, requesterNode }: MediaItemPressParams) => {
      const url = getUrlOfImageAttachment(attachment);
      if (!url) {
        return;
      }
      if (attachment.type === FileTypes.Video && !isVideoPlayerAvailable()) {
        // Safeguard for customizations that render videos without a player installed.
        openUrlSafely(url);
        return;
      }
      imageGalleryStateStore.openImageGallery({
        messages: messages?.map((message) => formatMessage(message)) ?? [],
        requesterNode,
        selectedAttachmentUrl: url,
      });
      setOverlay('gallery');
    },
    [imageGalleryStateStore, messages, setOverlay],
  );

  const renderItem = useCallback(
    ({ item }: { item: MediaTile }) => (
      <MediaItem
        attachment={item.attachment}
        message={item.message}
        onPress={handlePressItem}
        size={tileSize}
      />
    ),
    [handlePressItem, tileSize, MediaItem],
  );

  const loadMore = useCallback(() => {
    // hasNext is true by default, !!messages prevents calling search on initial load
    if (hasNext && !!messages) {
      searchSource.search();
    }
  }, [hasNext, messages, searchSource]);

  const emptyState =
    loading || isEmpty === undefined ? (
      <MediaListLoadingSkeleton />
    ) : (
      <EmptyList
        icon={icons.Picture}
        subtitle={t('Share a photo or video to see it here')}
        title={t('No photos or videos')}
      />
    );

  const loadingMoreIndicator = <>{loading && tiles.length > 0 && <ActivityIndicator />}</>;

  return (
    <View onLayout={onLayout} style={[styles.container, mediaList.container]}>
      <FlatList
        columnWrapperStyle={tiles.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={[styles.listContent, mediaList.listContent]}
        data={tiles}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListFooterComponent={loadingMoreIndicator}
        // FlatList rejects a `numColumns` change on a mounted list, so the count keys a remount;
        // `useGridScrollAnchor` restores the scroll position it would otherwise lose.
        key={columns}
        numColumns={columns}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        style={[styles.list, mediaList.list]}
        testID='media-list'
        {...additionalFlatListProps}
        {...scrollProps}
        ref={listRef}
      />
      <NotificationList />
    </View>
  );
};

export const MediaList = ({ searchSource, ...props }: MediaListProps) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `media-list:${channel.cid}` : undefined;

  if (!notificationHostId) {
    return null;
  }

  return (
    <ChannelMediaListProvider channel={channel} searchSource={searchSource}>
      <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
        <MediaListContent {...props} />
      </NotificationTargetProvider>
    </ChannelMediaListProvider>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        columnWrapper: {
          gap: MEDIA_GRID_GAP,
        },
        container: {
          flex: 1,
        },
        list: {
          flex: 1,
        },
        listContent: {
          flexGrow: 1,
          gap: MEDIA_GRID_GAP,
        },
      }),
    [],
  );
};
