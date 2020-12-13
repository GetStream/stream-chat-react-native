import React, { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ImageBackground,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetHandleProps,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { getPhotos } from '../../native';
import { vh, vw } from '../../utils/utils';

import type { AttachmentPickerErrorProps } from './components/AttachmentPickerError';

const styles = StyleSheet.create({
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

const screenHeight = vh(100);

type AttachmentImageProps = {
  ImageOverlaySelectedComponent: React.ComponentType;
  onPress: () => void;
  selected: boolean;
  uri: string;
  numberOfAttachmentPickerImageColumns?: number;
};

const AttachmentImage: React.FC<AttachmentImageProps> = (props) => {
  const {
    ImageOverlaySelectedComponent,
    numberOfAttachmentPickerImageColumns,
    onPress,
    selected,
    uri,
  } = props;
  const {
    theme: {
      attachmentPicker: { image, imageOverlay },
    },
  } = useTheme();

  const size = vw(100) / (numberOfAttachmentPickerImageColumns ?? 3) - 2;

  return (
    <TouchableOpacity onPress={onPress}>
      <ImageBackground
        source={{ uri }}
        style={[
          {
            height: size,
            margin: 1,
            width: size,
          },
          image,
        ]}
      >
        {selected && (
          <View style={[styles.overlay, imageOverlay]}>
            <ImageOverlaySelectedComponent />
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
};

const renderImage = ({
  item,
}: {
  item: {
    ImageOverlaySelectedComponent: React.ComponentType;
    maxNumberOfFiles: number;
    selected: boolean;
    setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
    uri: string;
    numberOfAttachmentPickerImageColumns?: number;
  };
}) => {
  const {
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    selected,
    setSelectedImages,
    uri,
  } = item;
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
    <AttachmentImage
      ImageOverlaySelectedComponent={ImageOverlaySelectedComponent}
      numberOfAttachmentPickerImageColumns={
        numberOfAttachmentPickerImageColumns
      }
      onPress={onPress}
      selected={selected}
      uri={uri}
    />
  );
};

export type AttachmentPickerProps = {
  AttachmentPickerBottomSheetHandle: React.FC<BottomSheetHandleProps>;
  AttachmentPickerError: React.ComponentType<AttachmentPickerErrorProps>;
  AttachmentPickerErrorImage: React.ComponentType;
  ImageOverlaySelectedComponent: React.ComponentType;
  attachmentPickerBottomSheetHandleHeight?: number;
  attachmentPickerBottomSheetHeight?: number;
  attachmentPickerErrorButtonText?: string;
  attachmentPickerErrorText?: string;
  numberOfAttachmentImagesToLoadPerCall?: number;
  numberOfAttachmentPickerImageColumns?: number;
};

export const AttachmentPicker = React.forwardRef(
  (props: AttachmentPickerProps, ref: React.ForwardedRef<BottomSheet>) => {
    const {
      AttachmentPickerBottomSheetHandle,
      attachmentPickerBottomSheetHandleHeight,
      attachmentPickerBottomSheetHeight,
      AttachmentPickerError,
      attachmentPickerErrorButtonText,
      AttachmentPickerErrorImage,
      attachmentPickerErrorText,
      ImageOverlaySelectedComponent,
      numberOfAttachmentImagesToLoadPerCall,
      numberOfAttachmentPickerImageColumns,
    } = props;

    const {
      theme: {
        attachmentPicker: { bottomSheetContentContainer },
      },
    } = useTheme();
    const {
      maxNumberOfFiles,
      selectedImages,
      selectedPicker,
      setSelectedImages,
      setSelectedPicker,
      topInset,
    } = useAttachmentPickerContext();

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
          const results = await getPhotos({
            after: endCursor,
            first: numberOfAttachmentImagesToLoadPerCall ?? 60,
          });
          setEndCursor(results.endCursor);
          setHasNextPage(results.hasNextPage || false);
          setPhotos([...photos, ...results.assets]);
        } catch (error) {
          console.log(error);
          setPhotoError(true);
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
      ImageOverlaySelectedComponent,
      maxNumberOfFiles,
      numberOfAttachmentPickerImageColumns,
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
        <AttachmentPickerError
          attachmentPickerBottomSheetHeight={attachmentPickerBottomSheetHeight}
          attachmentPickerErrorButtonText={attachmentPickerErrorButtonText}
          AttachmentPickerErrorImage={AttachmentPickerErrorImage}
          attachmentPickerErrorText={attachmentPickerErrorText}
        />
      );
    }

    return (
      <BottomSheet
        handleComponent={AttachmentPickerBottomSheetHandle}
        // @ts-expect-error
        handleHeight={attachmentPickerBottomSheetHandleHeight || 20}
        initialSnapIndex={-1}
        onChange={(index: number) => setCurrentIndex(index)}
        ref={ref}
        snapPoints={[
          attachmentPickerBottomSheetHeight ?? 308,
          screenHeight - topInset,
        ]}
      >
        <BottomSheetFlatList
          contentContainerStyle={[
            styles.container,
            bottomSheetContentContainer,
          ]}
          data={selectedPhotos}
          keyExtractor={(item) => item.uri}
          numColumns={numberOfAttachmentPickerImageColumns ?? 3}
          onEndReached={getMorePhotos}
          renderItem={renderImage}
        />
      </BottomSheet>
    );
  },
);

AttachmentPicker.displayName = 'AttachmentPicker';
