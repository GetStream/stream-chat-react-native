import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { VideoThumbnail } from '../../../components/Attachment/VideoThumbnail';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useViewport } from '../../../hooks/useViewport';
import { FileTypes } from '../../../types/types';
import { BottomSheetFlatList } from '../../BottomSheetCompatibility/BottomSheetFlatList';
import { BottomSheetTouchableOpacity } from '../../BottomSheetCompatibility/BottomSheetTouchableOpacity';

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

export type ImageGalleryGridImageComponent = ({
  item,
}: {
  item: Photo & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };
}) => React.ReactElement | null;

export type ImageGalleryGridImageComponents = {
  avatarComponent?: ImageGalleryGridImageComponent;
  imageComponent?: ImageGalleryGridImageComponent;
};

export type GridImageItem = Photo &
  ImageGalleryGridImageComponents & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };

const GridImage = ({ item }: { item: GridImageItem }) => {
  const {
    theme: {
      imageGallery: {
        grid: { gridImage },
      },
    },
  } = useTheme();
  const { vw } = useViewport();
  const { imageComponent, ...restItem } = item;

  const { numberOfImageGalleryGridColumns, selectAndClose, thumb_url, type, uri } = restItem;

  const size = vw(100) / (numberOfImageGalleryGridColumns || 3) - 2;

  if (imageComponent) {
    return imageComponent({ item: restItem });
  }

  return (
    <BottomSheetTouchableOpacity accessibilityLabel='Grid Image' onPress={selectAndClose}>
      {type === FileTypes.Video ? (
        <View style={[styles.image, { height: size, width: size }, gridImage]}>
          <VideoThumbnail thumb_url={thumb_url} />
        </View>
      ) : (
        <Image source={{ uri }} style={[styles.image, { height: size, width: size }]} />
      )}
    </BottomSheetTouchableOpacity>
  );
};

const renderItem = ({ item }: { item: GridImageItem }) => <GridImage item={item} />;

export type ImageGridType = ImageGalleryGridImageComponents & {
  closeGridView: () => void;
  photos: Photo[];
  setSelectedMessage: React.Dispatch<
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

export const ImageGrid = (props: ImageGridType) => {
  const {
    avatarComponent,
    closeGridView,
    imageComponent,
    numberOfImageGalleryGridColumns,
    photos,
    setSelectedMessage,
  } = props;

  const {
    theme: {
      colors: { white },
      imageGallery: {
        grid: { container, contentContainer },
      },
    },
  } = useTheme();

  const imageGridItems = photos.map((photo) => ({
    ...photo,
    avatarComponent,
    imageComponent,
    numberOfImageGalleryGridColumns,
    selectAndClose: () => {
      setSelectedMessage({ messageId: photo.messageId, url: photo.uri });
      closeGridView();
    },
  }));

  return (
    <BottomSheetFlatList<GridImageItem>
      accessibilityLabel='Image Grid'
      contentContainerStyle={[
        styles.contentContainer,
        { backgroundColor: white },
        contentContainer,
      ]}
      data={imageGridItems as GridImageItem[]}
      keyExtractor={(item, index) => `${item.uri}-${index}`}
      numColumns={numberOfImageGalleryGridColumns || 3}
      renderItem={renderItem}
      style={container}
    />
  );
};

ImageGrid.displayName = 'ImageGrid{imageGallery{grid}}';
