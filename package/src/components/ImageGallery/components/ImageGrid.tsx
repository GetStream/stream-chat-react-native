import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { BottomSheetFlatList, TouchableOpacity } from '@gorhom/bottom-sheet';

import { VideoThumbnail } from '../../../components/Attachment/VideoThumbnail';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { vw } from '../../../utils/utils';

import type { Photo } from '../ImageGallery';

const styles = StyleSheet.create({
  avatarImage: {
    borderRadius: 22,
    height: 22,
    width: 22,
  },
  avatarImageWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    height: 24,
    margin: 8,
    width: 24,
  },
  contentContainer: {
    flexGrow: 1,
  },
  image: {
    margin: 1,
  },
});

export type ImageGalleryGridImageComponent<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ({
  item,
}: {
  item: Photo<StreamChatGenerics> & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };
}) => React.ReactElement | null;

export type ImageGalleryGridImageComponents<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  avatarComponent?: ImageGalleryGridImageComponent<StreamChatGenerics>;
  imageComponent?: ImageGalleryGridImageComponent<StreamChatGenerics>;
};

export type GridImageItem<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Photo<StreamChatGenerics> &
  ImageGalleryGridImageComponents<StreamChatGenerics> & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };

const GridImage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  item,
}: {
  item: GridImageItem<StreamChatGenerics>;
}) => {
  const {
    theme: {
      imageGallery: {
        grid: { gridImage },
      },
    },
  } = useTheme();
  const { imageComponent, ...restItem } = item;

  const { numberOfImageGalleryGridColumns, selectAndClose, type, uri } = restItem;

  const size = vw(100) / (numberOfImageGalleryGridColumns || 3) - 2;

  if (imageComponent) {
    return imageComponent({ item: restItem });
  }

  return (
    <TouchableOpacity onPress={selectAndClose}>
      {type === 'video' ? (
        <View style={[styles.image, { height: size, width: size }, gridImage]}>
          <VideoThumbnail />
        </View>
      ) : (
        <Image source={{ uri }} style={[styles.image, { height: size, width: size }]} />
      )}
    </TouchableOpacity>
  );
};

const renderItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  item,
}: {
  item: GridImageItem<StreamChatGenerics>;
}) => <GridImage item={item} />;

type Props<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  ImageGalleryGridImageComponents<StreamChatGenerics> & {
    closeGridView: () => void;
    photos: Photo<StreamChatGenerics>[];
    setImage: React.Dispatch<
      React.SetStateAction<
        | {
            messageId?: string | undefined;
            url?: string | undefined;
          }
        | undefined
      >
    >;
    numberOfImageGalleryGridColumns?: number;
  };

export const ImageGrid = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: Props<StreamChatGenerics>,
) => {
  const {
    avatarComponent,
    closeGridView,
    imageComponent,
    numberOfImageGalleryGridColumns,
    photos,
    setImage,
  } = props;

  const {
    theme: {
      colors: { white },
      imageGallery: {
        grid: { contentContainer },
      },
    },
  } = useTheme();

  const imageGridItems = photos.map((photo) => ({
    ...photo,
    avatarComponent,
    imageComponent,
    numberOfImageGalleryGridColumns,
    selectAndClose: () => {
      setImage({ messageId: photo.messageId, url: photo.uri });
      closeGridView();
    },
  }));

  return (
    <BottomSheetFlatList<GridImageItem<StreamChatGenerics>>
      contentContainerStyle={[
        styles.contentContainer,
        { backgroundColor: white },
        contentContainer,
      ]}
      data={imageGridItems as GridImageItem<StreamChatGenerics>[]}
      keyExtractor={(item, index) => `${item.uri}-${index}`}
      numColumns={numberOfImageGalleryGridColumns || 3}
      renderItem={renderItem}
    />
  );
};

ImageGrid.displayName = 'ImageGrid{imageGallery{grid}}';
