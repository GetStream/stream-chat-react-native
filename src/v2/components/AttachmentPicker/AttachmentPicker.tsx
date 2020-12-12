import React, { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ImageBackground,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';

import { BottomSheetHandle } from './components/BottomSheetHandle';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Check, Picture } from '../../icons';
import { getPhotos } from '../../native';
import { vh, vw } from '../../utils/utils';

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
  errorButtonText: {
    color: '#005FFF',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    bottom: 0,
    height: 308,
    left: 0,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
  },
  errorText: {
    fontSize: 14,
    marginHorizontal: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'flex-end',
    backgroundColor: '#00000080',
    flex: 1,
  },
});

const screenHeight = vh(100);

const renderImage = ({
  item,
}: {
  item: {
    maxNumberOfFiles: number;
    selected: boolean;
    setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
    uri: string;
  };
}) => {
  const { maxNumberOfFiles, selected, setSelectedImages, uri } = item;
  const onPress = () => {
    if (selected) {
      setSelectedImages((images) => images.filter((image) => image !== uri));
    } else {
      setSelectedImages((images) => {
        if (images.length >= maxNumberOfFiles) {
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

export const AttachmentPicker = React.forwardRef(
  (_props, ref: React.ForwardedRef<BottomSheet>) => {
    const {
      maxNumberOfFiles,
      selectedImages,
      selectedPicker,
      setSelectedImages,
      setSelectedPicker,
      topInset,
    } = useAttachmentPickerContext();
    const { t } = useTranslationContext();

    const [appState, setAppState] = useState<AppStateStatus>();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [endCursor, setEndCursor] = useState<string>();
    const [photoError, setPhotoError] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);

    const hideAttachmentPicker = () => {
      setSelectedPicker(undefined);
      if ((ref as React.MutableRefObject<BottomSheet>)?.current) {
        (ref as React.MutableRefObject<BottomSheet>).current.close();
      }
    };

    const getMorePhotos = async () => {
      if (hasNextPage && !loadingPhotos) {
        setLoadingPhotos(true);
        try {
          const results = await getPhotos({ after: endCursor, first: 60 });
          console.log('hi', results);

          setEndCursor(results.endCursor);
          setHasNextPage(results.hasNextPage || false);
          setPhotos([...photos, ...results.assets]);
        } catch (error) {
          setPhotoError(true);
          console.log('hi', error);
        }
        setLoadingPhotos(false);
      }
    };

    useEffect(() => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        setAppState(nextAppState);
      };
      AppState.addEventListener('change', handleAppStateChange);

      return () => {
        AppState.removeEventListener('change', handleAppStateChange);
      };
    }, []);

    useEffect(() => {
      if (Platform.OS === 'ios') {
        Keyboard.addListener('keyboardWillShow', hideAttachmentPicker);
      } else {
        Keyboard.addListener('keyboardDidShow', hideAttachmentPicker);
      }

      return () => {
        if (Platform.OS === 'ios') {
          Keyboard.removeListener('keyboardWillShow', hideAttachmentPicker);
        } else {
          Keyboard.removeListener('keyboardDidShow', hideAttachmentPicker);
        }
      };
    }, []);

    useEffect(() => {
      if (currentIndex < 0) {
        setSelectedPicker(undefined);
      }
    }, [currentIndex]);

    useEffect(() => {
      setPhotoError(false);
      getMorePhotos();
    }, [appState]);

    useEffect(() => {
      if (photos.length === 0 && currentIndex > -1) {
        getMorePhotos();
      }
    }, [currentIndex]);

    const selectedPhotos = photos.map((photo) => ({
      maxNumberOfFiles,
      selected: selectedImages.includes(photo),
      setSelectedImages,
      uri: photo,
    }));

    /**
     * TODO: Remove the need to return null here, changing snapPoints breaks the position
     * so initial render should occur after topInset is set currently
     */
    if (topInset === undefined) {
      return null;
    }

    if (selectedPicker === 'images' && photoError) {
      return (
        <View style={[styles.errorContainer]}>
          <Picture height={140} pathFill={'#DBDBDB'} width={140} />
          <Text style={styles.errorText}>
            {t(
              'Please enable access to your photos and videos so you can share them.',
            )}
          </Text>
          <Text
            onPress={Linking.openSettings}
            style={styles.errorButtonText}
            suppressHighlighting
          >
            {t('Allow access to your Gallery')}
          </Text>
        </View>
      );
    }

    return (
      <BottomSheet
        handleComponent={BottomSheetHandle}
        // @ts-expect-error
        handleHeight={20}
        initialSnapIndex={-1}
        onChange={(index: number) => setCurrentIndex(index)}
        ref={ref}
        snapPoints={[308, screenHeight - topInset]}
      >
        <BottomSheetFlatList
          contentContainerStyle={styles.container}
          data={selectedPhotos}
          keyExtractor={(item) => item.uri}
          numColumns={3}
          onEndReached={getMorePhotos}
          renderItem={renderImage}
        />
      </BottomSheet>
    );
  },
);

AttachmentPicker.displayName = 'AttachmentPicker';
