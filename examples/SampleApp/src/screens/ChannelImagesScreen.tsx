import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DateHeader,
  useImageGalleryContext,
  useOverlayContext,
  useTheme,
  ImageGalleryState,
  useStateStore,
} from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { usePaginatedAttachments } from '../hooks/usePaginatedAttachments';
import { Picture } from '../icons/Picture';

import type { RouteProp } from '@react-navigation/native';

import type { StackNavigatorParamList } from '../types';

const screen = Dimensions.get('screen').width;

const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1 },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  flex: { flex: 1 },
  noMedia: {
    fontSize: 16,
    paddingBottom: 8,
  },
  noMediaDetails: {
    fontSize: 14,
    textAlign: 'center',
  },
  stickyHeader: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 8, // DateHeader already has marginTop 8
  },
});

type ChannelImagesScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelImagesScreen'>;

export type ChannelImagesScreenProps = {
  route: ChannelImagesScreenRouteProp;
};

const selector = (state: ImageGalleryState) => ({
  assets: state.assets,
});

export const ChannelImagesScreen: React.FC<ChannelImagesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { assets } = useStateStore(imageGalleryStateStore.state, selector);
  const { setOverlay } = useOverlayContext();
  const { loading, loadMore, messages } = usePaginatedAttachments(channel, 'image');
  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  const [stickyHeaderDate, setStickyHeaderDate] = useState(
    Dayjs(messages?.[0]?.created_at).format('MMM YYYY'),
  );
  const stickyHeaderDateRef = useRef('');

  const updateStickyDate = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems?.length) {
      const lastItem = viewableItems[0];

      const created_at = lastItem?.item?.created_at;

      if (
        created_at &&
        !lastItem.item.deleted_at &&
        Dayjs(created_at).format('MMM YYYY') !== stickyHeaderDateRef.current
      ) {
        stickyHeaderDateRef.current = Dayjs(created_at).format('MMM YYYY');
        const isCurrentYear = new Date(created_at).getFullYear() === new Date().getFullYear();
        setStickyHeaderDate(
          isCurrentYear ? Dayjs(created_at).format('MMM') : Dayjs(created_at).format('MMM YYYY'),
        );
      }
    }
  });

  const messagesWithImages = messages
    .map((message) => ({ ...message, groupStyles: [], readBy: false }))
    .filter((message) => {
      if (!message.deleted_at && message.attachments) {
        return message.attachments.some(
          (attachment) =>
            attachment.type === 'image' &&
            !attachment.title_link &&
            !attachment.og_scrape_url &&
            (attachment.image_url || attachment.thumb_url),
        );
      }
      return false;
    });

  useEffect(() => {
    imageGalleryStateStore.openImageGallery({ messages: messagesWithImages });
    return () => imageGalleryStateStore.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageGalleryStateStore, messagesWithImages.length]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: white }]}>
      <ScreenHeader inSafeArea titleText='Photos and Videos' />
      <View style={styles.flex}>
        <FlatList
          contentContainerStyle={styles.contentContainer}
          data={assets}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          ListEmptyComponent={EmptyListComponent}
          numColumns={3}
          onEndReached={loadMore}
          onViewableItemsChanged={updateStickyDate.current}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                imageGalleryStateStore.openImageGallery({
                  messages: messagesWithImages,
                  selectedAttachmentUrl: item.uri,
                });
                setOverlay('gallery');
              }}
            >
              <Image
                source={{ uri: item.uri }}
                style={{
                  height: screen / 3,
                  margin: 1,
                  width: screen / 3 - 2,
                }}
              />
            </TouchableOpacity>
          )}
          style={styles.flex}
          viewabilityConfig={{
            viewAreaCoveragePercentThreshold: 50,
          }}
        />
        {assets.length > 0 ? (
          <View style={styles.stickyHeader}>
            <DateHeader dateString={stickyHeaderDate} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const EmptyListComponent = () => {
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
    },
  } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <Picture fill={grey_gainsboro} scale={6} />
      <Text style={[styles.noMedia, { color: black }]}>No media</Text>
      <Text style={[styles.noMediaDetails, { color: grey }]}>
        Photos or video sent in this chat will appear here
      </Text>
    </View>
  );
};
