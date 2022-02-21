import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

import { BottomSheetFlatList, TouchableOpacity } from '@gorhom/bottom-sheet';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { vw } from '../../../utils/utils';
import { Avatar } from '../../Avatar/Avatar';

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
      colors: { white },
      imageGallery: {
        grid: { gridAvatar, gridAvatarWrapper, gridImage },
      },
    },
  } = useTheme('ImageGrid');
  const { avatarComponent, imageComponent, ...restItem } = item;

  const { numberOfImageGalleryGridColumns, selectAndClose, uri, user } = restItem;

  const size = vw(100) / (numberOfImageGalleryGridColumns || 3) - 2;

  if (imageComponent) {
    return imageComponent({ item: restItem });
  }

  return (
    <TouchableOpacity onPress={selectAndClose}>
      <ImageBackground
        source={{ uri }}
        style={[styles.image, { height: size, width: size }, gridImage]}
      >
        {avatarComponent
          ? avatarComponent({ item: restItem })
          : !!user?.image && (
              <Avatar
                containerStyle={[
                  styles.avatarImageWrapper,
                  { backgroundColor: white },
                  gridAvatarWrapper,
                ]}
                image={user.image}
                imageStyle={gridAvatar}
                size={22}
              />
            )}
      </ImageBackground>
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
    resetVisibleValues: () => void;
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
    resetVisibleValues,
    setImage,
  } = props;

  const {
    theme: {
      colors: { white },
      imageGallery: {
        grid: { contentContainer },
      },
    },
  } = useTheme('ImageGrid');

  const imageGridItems = photos.map((photo) => ({
    ...photo,
    avatarComponent,
    imageComponent,
    numberOfImageGalleryGridColumns,
    selectAndClose: () => {
      resetVisibleValues();
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
