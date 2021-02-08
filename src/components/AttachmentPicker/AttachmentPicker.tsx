import React, { useEffect, useState } from 'react';
import {
  BackHandler,
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
import { Asset, getPhotos } from '../../native';
import { vh, vw } from '../../utils/utils';

import type { AttachmentPickerErrorProps } from './components/AttachmentPickerError';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  overlay: {
    alignItems: 'flex-end',
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
      colors: { overlay },
    },
  } = useTheme();

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

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
          <View
            style={[styles.overlay, { backgroundColor: overlay }, imageOverlay]}
          >
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
    asset: Asset;
    ImageOverlaySelectedComponent: React.ComponentType;
    maxNumberOfFiles: number;
    selected: boolean;
    setSelectedImages: React.Dispatch<React.SetStateAction<Asset[]>>;
    numberOfAttachmentPickerImageColumns?: number;
  };
}) => {
  const {
    asset,
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    selected,
    setSelectedImages,
  } = item;
  const onPress = () => {
    if (selected) {
      setSelectedImages((images) =>
        images.filter((image) => image.uri !== asset.uri),
      );
    } else {
      setSelectedImages((images) => {
        if (images.length >= maxNumberOfFiles) {
          return images;
        }
        return [...images, asset];
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
      uri={asset.uri}
    />
  );
};

export type AttachmentPickerProps = {
  /**
   * Custom UI component to render [draggable handle](https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/docs/1.png) of attachment picker.
   *
   * **Default** [AttachmentPickerBottomSheetHandle](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/src/components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle.tsx)
   */
  AttachmentPickerBottomSheetHandle: React.FC<BottomSheetHandleProps>;
  /**
   * Custom UI component to render error component while opening attachment picker.
   *
   * **Default** [AttachmentPickerError](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/src/components/AttachmentPicker/components/AttachmentPickerError.tsx)
   */
  AttachmentPickerError: React.ComponentType<AttachmentPickerErrorProps>;
  /**
   * Custom UI component to render error image for attachment picker
   *
   * **Default** [AttachmentPickerErrorImage](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/src/components/AttachmentPicker/components/AttachmentPickerErrorImage.tsx)
   */
  AttachmentPickerErrorImage: React.ComponentType;
  /**
   * Custom UI component to render overlay component, that shows up on top of [selected image](https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/docs/1.png) (with tick mark)
   *
   * **Default** [ImageOverlaySelectedComponent](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/src/components/AttachmentPicker/components/ImageOverlaySelectedComponent.tsx)
   */
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
        colors: { white },
      },
    } = useTheme();
    const {
      closePicker,
      maxNumberOfFiles,
      selectedImages,
      selectedPicker,
      setSelectedImages,
      setSelectedPicker,
      topInset,
    } = useAttachmentPickerContext();

    const [currentIndex, setCurrentIndex] = useState(-1);
    const [endCursor, setEndCursor] = useState<string>();
    const [photoError, setPhotoError] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [photos, setPhotos] = useState<Asset[]>([]);

    const hideAttachmentPicker = () => {
      setSelectedPicker(undefined);
      if ((ref as React.MutableRefObject<BottomSheet>)?.current) {
        (ref as React.MutableRefObject<BottomSheet>).current.close();
      }
    };

    const getMorePhotos = async () => {
      if (
        hasNextPage &&
        !loadingPhotos &&
        currentIndex > -1 &&
        selectedPicker === 'images'
      ) {
        setLoadingPhotos(true);
        try {
          const results = await getPhotos({
            after: endCursor,
            first: numberOfAttachmentImagesToLoadPerCall ?? 60,
          });
          if (endCursor) {
            setPhotos([...photos, ...results.assets]);
          } else {
            setPhotos(results.assets);
          }
          setEndCursor(results.endCursor);
          setHasNextPage(results.hasNextPage || false);
        } catch (error) {
          console.log(error);
          setPhotoError(true);
        }
        setLoadingPhotos(false);
      }
    };

    useEffect(() => {
      const backAction = () => {
        if (selectedPicker) {
          setSelectedPicker(undefined);
          closePicker();
          return true;
        }

        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [selectedPicker]);

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
        if (!loadingPhotos) {
          setEndCursor(undefined);
          setHasNextPage(true);
        }
      }
      if (
        selectedPicker === 'images' &&
        endCursor === undefined &&
        currentIndex > -1
      ) {
        setPhotoError(false);
        getMorePhotos();
      }
    }, [currentIndex]);

    const selectedPhotos = photos.map((asset) => ({
      asset,
      ImageOverlaySelectedComponent,
      maxNumberOfFiles,
      numberOfAttachmentPickerImageColumns,
      selected: selectedImages.some((image) => image.uri === asset.uri),
      setSelectedImages,
    }));

    /**
     * TODO: Remove the need to return null here, changing snapPoints breaks the position
     * so initial render should occur after topInset is set currently
     */
    if (topInset === undefined) {
      return null;
    }

    return (
      <>
        <BottomSheet
          handleComponent={
            photoError ? () => null : AttachmentPickerBottomSheetHandle
          }
          // @ts-expect-error
          handleHeight={attachmentPickerBottomSheetHandleHeight || 20}
          initialSnapIndex={-1}
          onChange={(index: number) => setCurrentIndex(index)}
          ref={ref}
          snapPoints={[
            attachmentPickerBottomSheetHeight ?? 308,
            screenHeight - topInset,
          ]}
          style={{ opacity: photoError ? 0 : 1 }}
        >
          <BottomSheetFlatList
            contentContainerStyle={[
              styles.container,
              { backgroundColor: white },
              bottomSheetContentContainer,
              { opacity: photoError ? 0 : 1 },
            ]}
            data={selectedPhotos}
            keyExtractor={(item) => item.asset.uri}
            numColumns={numberOfAttachmentPickerImageColumns ?? 3}
            onEndReached={getMorePhotos}
            renderItem={renderImage}
          />
        </BottomSheet>
        {selectedPicker === 'images' && photoError && (
          <AttachmentPickerError
            attachmentPickerBottomSheetHeight={
              attachmentPickerBottomSheetHeight
            }
            attachmentPickerErrorButtonText={attachmentPickerErrorButtonText}
            AttachmentPickerErrorImage={AttachmentPickerErrorImage}
            attachmentPickerErrorText={attachmentPickerErrorText}
          />
        )}
      </>
    );
  },
);

AttachmentPicker.displayName = 'AttachmentPicker';
