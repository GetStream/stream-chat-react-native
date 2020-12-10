import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { BottomSheetFlatList, TouchableOpacity } from '@gorhom/bottom-sheet';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { Check } from '../../../icons';
import { getPhotos } from '../../../native';
import { vw } from '../../../utils/utils';

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 8,
    width: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  overlay: {
    alignItems: 'flex-end',
    backgroundColor: '#00000080',
    flex: 1,
  },
});

const renderImage = ({
  item,
}: {
  item: {
    selected: boolean;
    setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
    uri: string;
  };
}) => {
  const { selected, setSelectedImages, uri } = item;
  const onPress = () => {
    if (selected) {
      setSelectedImages((images) => images.filter((image) => image !== uri));
    } else {
      setSelectedImages((images) => {
        if (images.length > 9) {
          return images;
        } else {
          return [...images, uri];
        }
      });
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <ImageBackground
        source={{ uri }}
        style={{
          height: vw(100) / 3 - 2,
          margin: 1,
          width: vw(100) / 3 - 2,
        }}
      >
        {selected && (
          <View style={styles.overlay}>
            <View style={styles.check}>
              <Check />
            </View>
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
};

export const ImagesPicker: React.FC<{ currentIndex: number }> = ({
  currentIndex,
}) => {
  const { selectedImages, setSelectedImages } = useAttachmentPickerContext();

  const [endCursor, setEndCursor] = useState<string>();
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const getMorePhotos = async () => {
    if (hasNextPage && !loadingPhotos) {
      setLoadingPhotos(true);
      try {
        const results = await getPhotos({ after: endCursor, first: 60 });
        setEndCursor(results.endCursor);
        setHasNextPage(results.hasNextPage || false);
        setPhotos([...photos, ...results.assets]);
      } catch (error) {
        console.log(error);
      }
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    if (photos.length === 0) {
      getMorePhotos();
    }
  }, [currentIndex]);

  const selectedPhotos = photos.map((photo) => ({
    selected: selectedImages.includes(photo),
    setSelectedImages,
    uri: photo,
  }));

  return (
    <BottomSheetFlatList
      contentContainerStyle={styles.container}
      data={selectedPhotos}
      keyExtractor={(item) => item.uri}
      numColumns={3}
      onEndReached={getMorePhotos}
      renderItem={renderImage}
    />
  );
};
