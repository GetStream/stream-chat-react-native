import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { VideoThumbnail } from '../../../components/Attachment/VideoThumbnail';
import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { useViewport } from '../../../hooks/useViewport';
import type {
  ImageGalleryAsset,
  ImageGalleryState,
} from '../../../state-store/image-gallery-state-store';
import { FileTypes } from '../../../types/types';
import { BottomSheetFlatList } from '../../BottomSheetCompatibility/BottomSheetFlatList';
import { BottomSheetTouchableOpacity } from '../../BottomSheetCompatibility/BottomSheetTouchableOpacity';

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
  item: ImageGalleryAsset & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };
}) => React.ReactElement | null;

export type ImageGalleryGridImageComponents = {
  avatarComponent?: ImageGalleryGridImageComponent;
  imageComponent?: ImageGalleryGridImageComponent;
};

export type GridImageItem = ImageGalleryAsset &
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
  numberOfImageGalleryGridColumns?: number;
};

const imageGallerySelector = (state: ImageGalleryState) => ({
  assets: state.assets,
});

export const ImageGrid = (props: ImageGridType) => {
  const { avatarComponent, closeGridView, imageComponent, numberOfImageGalleryGridColumns } = props;
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { assets } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);

  const {
    theme: {
      colors: { white },
      imageGallery: {
        grid: { container, contentContainer },
      },
    },
  } = useTheme();

  const imageGridItems = assets.map((photo, index) => ({
    ...photo,
    avatarComponent,
    imageComponent,
    numberOfImageGalleryGridColumns,
    selectAndClose: () => {
      imageGalleryStateStore.currentIndex = index;
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
