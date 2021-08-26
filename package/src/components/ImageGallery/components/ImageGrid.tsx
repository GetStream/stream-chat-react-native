import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { BottomSheetFlatList, TouchableOpacity } from '@gorhom/bottom-sheet';

import { Avatar } from '../../Avatar/Avatar';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useUserFormat } from '../../../contexts/formatContext/UserFormatContext';
import { vw } from '../../../utils/utils';

import type { Photo } from '../ImageGallery';

import type { DefaultUserType, UnknownType } from '../../../types/types';

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

export type ImageGalleryGridImageComponent<Us extends UnknownType = DefaultUserType> = ({
  item,
}: {
  item: Photo<Us> & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };
}) => React.ReactElement | null;

export type ImageGalleryGridImageComponents<Us extends UnknownType = DefaultUserType> = {
  avatarComponent?: ImageGalleryGridImageComponent<Us>;
  imageComponent?: ImageGalleryGridImageComponent<Us>;
};

export type GridImageItem<Us extends DefaultUserType = DefaultUserType> = Photo<Us> &
  ImageGalleryGridImageComponents<Us> & {
    selectAndClose: () => void;
    numberOfImageGalleryGridColumns?: number;
  };

const GridImage = <Us extends DefaultUserType = DefaultUserType>({
  item,
}: {
  item: GridImageItem<Us>;
}) => {
  const {
    theme: {
      colors: { white },
      imageGallery: {
        grid: { gridAvatar, gridAvatarWrapper, gridImage },
      },
    },
  } = useTheme();
  const { avatarComponent, imageComponent, ...restItem } = item;

  const { numberOfImageGalleryGridColumns, selectAndClose, uri, user } = restItem;

  const size = vw(100) / (numberOfImageGalleryGridColumns || 3) - 2;

  const { formatImage } = useUserFormat<Us>();
  if (imageComponent) {
    return imageComponent({ item: restItem });
  }

  const userImage = formatImage(user);

  return (
    <TouchableOpacity onPress={selectAndClose}>
      <ImageBackground
        source={{ uri }}
        style={[styles.image, { height: size, width: size }, gridImage]}
      >
        {avatarComponent
          ? avatarComponent({ item: restItem })
          : !!userImage && (
              <Avatar
                containerStyle={[
                  styles.avatarImageWrapper,
                  { backgroundColor: white },
                  gridAvatarWrapper,
                ]}
                image={userImage}
                imageStyle={gridAvatar}
                size={22}
              />
            )}
      </ImageBackground>
    </TouchableOpacity>
  );
};

const renderItem = <Us extends UnknownType = DefaultUserType>({
  item,
}: {
  item: GridImageItem<Us>;
}) => <GridImage item={item} />;

type Props<Us extends UnknownType = DefaultUserType> = ImageGalleryGridImageComponents<Us> & {
  closeGridView: () => void;
  photos: Photo<Us>[];
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

export const ImageGrid = <Us extends UnknownType = DefaultUserType>(props: Props<Us>) => {
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
  } = useTheme();

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
    <BottomSheetFlatList
      contentContainerStyle={[
        styles.contentContainer,
        { backgroundColor: white },
        contentContainer,
      ]}
      data={imageGridItems}
      keyExtractor={(item, index) => `${item.uri}-${index}`}
      numColumns={numberOfImageGalleryGridColumns || 3}
      renderItem={renderItem}
    />
  );
};

ImageGrid.displayName = 'ImageGrid{imageGallery{grid}}';
