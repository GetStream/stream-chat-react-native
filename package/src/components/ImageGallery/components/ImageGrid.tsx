import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { SvgUri } from 'react-native-svg';

import type { ImageGalleryGridProps } from './types';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContextBase';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useIsSvg } from '../../../hooks/useIsSvg';
import { useStateStore } from '../../../hooks/useStateStore';
import { useViewport } from '../../../hooks/useViewport';
import type {
  ImageGalleryAsset,
  ImageGalleryState,
} from '../../../state-store/image-gallery-state-store';
import { primitives } from '../../../theme';
import { FileTypes } from '../../../types/types';
import { VideoPlayIndicator } from '../../ui/VideoPlayIndicator';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';

export type ImageGalleryGridImageComponent = ({
  item,
}: {
  item: ImageGalleryAsset & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };
}) => React.ReactElement | null;

export type GridImageItem = ImageGalleryAsset & {
  selectAndClose: () => void;
  numberOfImageGalleryGridColumns?: number;
};

const GridImage = ({ item }: { item: GridImageItem }) => {
  const styles = useStyles();
  const { vw } = useViewport();
  const { ...restItem } = item;

  const { numberOfImageGalleryGridColumns, selectAndClose, thumb_url, type, uri } = restItem;
  const isSvg = useIsSvg(uri);

  const size = vw(100) / (numberOfImageGalleryGridColumns || 3) - 2;

  return (
    <Pressable accessibilityLabel='Grid Image' onPress={selectAndClose}>
      {type === FileTypes.Video ? (
        <View style={[styles.image, { height: size, width: size }, styles.videoCell]}>
          {thumb_url ? <Image source={{ uri: thumb_url }} style={StyleSheet.absoluteFill} /> : null}
          <View pointerEvents='none' style={[StyleSheet.absoluteFill, styles.playIndicator]}>
            <VideoPlayIndicator size='md' />
          </View>
        </View>
      ) : isSvg ? (
        <View style={[styles.image, { height: size, width: size }]}>
          <SvgUri height='100%' uri={uri} width='100%' />
        </View>
      ) : (
        <Image source={{ uri }} style={[styles.image, { height: size, width: size }]} />
      )}
    </Pressable>
  );
};

const renderItem = ({ item }: { item: GridImageItem }) => <GridImage item={item} />;

const imageGallerySelector = (state: ImageGalleryState) => ({
  assets: state.assets,
});

export const ImageGalleryGrid = (props: ImageGalleryGridProps) => {
  const { closeGridView, numberOfImageGalleryGridColumns } = props;
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { assets } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);

  const {
    theme: {
      imageGallery: {
        grid: { container },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const imageGridItems = assets.map((photo, index) => ({
    ...photo,
    numberOfImageGalleryGridColumns,
    selectAndClose: () => {
      imageGalleryStateStore.currentIndex = index;
      closeGridView();
    },
  }));

  return (
    <StreamBottomSheetModalFlatList<GridImageItem>
      accessibilityLabel='Image Grid'
      contentContainerStyle={styles.contentContainer}
      data={imageGridItems as GridImageItem[]}
      keyExtractor={(item, index) => `${item.uri}-${index}`}
      numColumns={numberOfImageGalleryGridColumns || 3}
      renderItem={renderItem}
      style={container}
    />
  );
};

ImageGalleryGrid.displayName = 'ImageGalleryGrid{imageGallery{grid}}';

const useStyles = () => {
  const {
    theme: {
      imageGallery: {
        grid: { contentContainer, gridImage },
      },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      contentContainer: {
        flexGrow: 1,
        backgroundColor: semantics.backgroundCoreApp,
        marginTop: primitives.spacingSm,
        ...contentContainer,
      },
      image: { margin: 1, ...gridImage },
      playIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      videoCell: {
        overflow: 'hidden',
      },
    });
  }, [contentContainer, gridImage, semantics]);
};
