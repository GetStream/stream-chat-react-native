import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type FlatListProps,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  formatMessage,
  type MessageResponse,
  type MessageSearchSource,
  type SearchSourceState,
} from 'stream-chat';

import { type MediaItemPressParams } from './MediaItem';
import { MediaListLoadingSkeleton } from './MediaListLoadingSkeleton';

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
import { useStateStore } from '../../../../hooks/useStateStore';
import { Picture } from '../../../../icons/image';
import { isVideoPlayerAvailable } from '../../../../native';
import { primitives } from '../../../../theme';
import { FileTypes } from '../../../../types/types';
import { getUrlOfImageAttachment } from '../../../../utils/getUrlOfImageAttachment';
import { openUrlSafely } from '../../../Attachment/utils/openUrlSafely';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';
import { NotificationList } from '../../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { EmptyList } from '../../../UIComponents/EmptyList';
import { type MediaTile, useMediaList } from '../../hooks/useMediaList';

const NUMBER_OF_COLUMNS = 3;
const GRID_GAP = primitives.spacingXxxs;

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
};

const keyExtractor = (item: MediaTile, index: number) => `${item.message.id}-${index}`;

const listStateSelector = (state: SearchSourceState<MessageResponse>) => ({
  error: state.lastQueryError,
  hasNext: state.hasNext,
  loading: state.isLoading,
  messages: state.items,
});

const MediaListContent = ({ additionalFlatListProps }: MediaListProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: { mediaList },
    },
  } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { MediaItem } = useComponentsContext();

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

  // Tile side length: full width minus the inter-column gaps, split across the columns.
  const tileSize = useMemo(
    () => (width - GRID_GAP * (NUMBER_OF_COLUMNS - 1)) / NUMBER_OF_COLUMNS,
    [width],
  );

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
        icon={Picture}
        subtitle={t('Share a photo or video to see it here')}
        title={t('No photos or videos')}
      />
    );

  const loadingMoreIndicator = <>{loading && tiles.length > 0 && <ActivityIndicator />}</>;

  return (
    <View style={[styles.container, mediaList.container]}>
      <FlatList
        columnWrapperStyle={tiles.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={[styles.listContent, mediaList.listContent]}
        data={tiles}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListFooterComponent={loadingMoreIndicator}
        numColumns={NUMBER_OF_COLUMNS}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        style={[styles.list, mediaList.list]}
        testID='media-list'
        {...additionalFlatListProps}
      />
      <NotificationList />
    </View>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
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
          gap: GRID_GAP,
        },
        container: {
          flex: 1,
        },
        list: {
          flex: 1,
        },
        listContent: {
          flexGrow: 1,
          gap: GRID_GAP,
        },
      }),
    [],
  );
};
