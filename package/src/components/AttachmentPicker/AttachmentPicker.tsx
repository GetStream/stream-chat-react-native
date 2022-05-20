import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  ImageBackground,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetHandleProps,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';

import type { AttachmentPickerErrorProps } from './components/AttachmentPickerError';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Asset, getPhotos } from '../../native';
import { vh, vw } from '../../utils/utils';

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
const fullScreenHeight = Dimensions.get('window').height;

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
          <View style={[styles.overlay, { backgroundColor: overlay }, imageOverlay]}>
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
      setSelectedImages((images) => images.filter((image) => image.uri !== asset.uri));
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
      numberOfAttachmentPickerImageColumns={numberOfAttachmentPickerImageColumns}
      onPress={onPress}
      selected={selected}
      uri={asset.uri}
    />
  );
};

export type AttachmentPickerProps = {
  /**
   * Custom UI component to render [draggable handle](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/1.png) of attachment picker.
   *
   * **Default** [AttachmentPickerBottomSheetHandle](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle.tsx)
   */
  AttachmentPickerBottomSheetHandle: React.FC<BottomSheetHandleProps>;
  /**
   * Custom UI component to render error component while opening attachment picker.
   *
   * **Default** [AttachmentPickerError](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/AttachmentPicker/components/AttachmentPickerError.tsx)
   */
  AttachmentPickerError: React.ComponentType<AttachmentPickerErrorProps>;
  /**
   * Custom UI component to render error image for attachment picker
   *
   * **Default** [AttachmentPickerErrorImage](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/AttachmentPicker/components/AttachmentPickerErrorImage.tsx)
   */
  AttachmentPickerErrorImage: React.ComponentType;
  /**
   * Custom UI component to render overlay component, that shows up on top of [selected image](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/1.png) (with tick mark)
   *
   * **Default** [ImageOverlaySelectedComponent](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/AttachmentPicker/components/ImageOverlaySelectedComponent.tsx)
   */
  ImageOverlaySelectedComponent: React.ComponentType;
  attachmentPickerBottomSheetHandleHeight?: number;
  attachmentPickerBottomSheetHeight?: number;
  attachmentPickerErrorButtonText?: string;
  attachmentPickerErrorText?: string;
  numberOfAttachmentImagesToLoadPerCall?: number;
  numberOfAttachmentPickerImageColumns?: number;
  translucentStatusBar?: boolean;
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
      translucentStatusBar,
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
    const bottomSheetCloseOnKeyboardShowTimeout = useRef<NodeJS.Timeout>();

    const getMorePhotos = async () => {
      if (hasNextPage && !loadingPhotos && currentIndex > -1 && selectedPicker === 'images') {
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

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }, [selectedPicker]);

    useEffect(() => {
      const hideAttachmentPicker = () => {
        if (bottomSheetCloseOnKeyboardShowTimeout.current) {
          clearTimeout(bottomSheetCloseOnKeyboardShowTimeout.current);
        }
        setSelectedPicker(undefined);
        // This short timeout is to prevent a race condition
        // where the close function is called during the point when a internal container layout happens within the bottomsheet due to keyboard affecting the layout
        // If the container layout measures a shorter height than previous but if the close snapped to the previous height's position, the bottom sheet will show up
        // this short delay ensures that close function is always called after a container layout due to keyboard change
        bottomSheetCloseOnKeyboardShowTimeout.current = setTimeout(
          () => (ref as React.MutableRefObject<BottomSheet | undefined>).current?.close(),
          150,
        );
      };
      const keyboardSubscription =
        Platform.OS === 'ios'
          ? Keyboard.addListener('keyboardWillShow', hideAttachmentPicker)
          : Keyboard.addListener('keyboardDidShow', hideAttachmentPicker);

      return () => {
        if (keyboardSubscription?.remove) {
          keyboardSubscription.remove();
          return;
        }

        // To keep compatibility with older versions of React Native, where `remove()` is not available
        if (Platform.OS === 'ios') {
          Keyboard.removeListener('keyboardWillShow', hideAttachmentPicker);
        } else {
          Keyboard.removeListener('keyboardDidShow', hideAttachmentPicker);
        }
        if (bottomSheetCloseOnKeyboardShowTimeout.current) {
          clearTimeout(bottomSheetCloseOnKeyboardShowTimeout.current);
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
    }, [currentIndex]);

    useEffect(() => {
      if (
        selectedPicker === 'images' &&
        endCursor === undefined &&
        currentIndex > -1 &&
        !loadingPhotos
      ) {
        setPhotoError(false);
        getMorePhotos();
      }
    }, [currentIndex, selectedPicker]);

    const selectedPhotos = photos.map((asset) => ({
      asset,
      ImageOverlaySelectedComponent,
      maxNumberOfFiles,
      numberOfAttachmentPickerImageColumns,
      selected: selectedImages.some((image) => image.uri === asset.uri),
      setSelectedImages,
    }));

    const handleHeight = attachmentPickerBottomSheetHandleHeight || 20;

    /**
     * This is to handle issues with Android measurements coming back incorrect.
     * If the StatusBar height is perfectly 1/2 of the difference between the two
     * dimensions for screen and window, it is incorrect and we need to account for
     * this. If you use a translucent header bar more adjustments are needed.
     */
    const statusBarHeight = StatusBar.currentHeight ?? 0;
    const bottomBarHeight = fullScreenHeight - screenHeight - statusBarHeight;
    const androidBottomBarHeightAdjustment =
      Platform.OS === 'android'
        ? bottomBarHeight === statusBarHeight
          ? translucentStatusBar
            ? 0
            : StatusBar.currentHeight ?? 0
          : translucentStatusBar
          ? bottomBarHeight > statusBarHeight
            ? -bottomBarHeight + statusBarHeight
            : bottomBarHeight > 0
            ? -statusBarHeight
            : 0
          : bottomBarHeight > 0
          ? 0
          : statusBarHeight
        : 0;

    const initialSnapPoint =
      attachmentPickerBottomSheetHeight ?? Platform.OS === 'android'
        ? 308 + (fullScreenHeight - screenHeight + androidBottomBarHeightAdjustment) - handleHeight
        : 308 + (fullScreenHeight - screenHeight + androidBottomBarHeightAdjustment);

    const finalSnapPoint =
      Platform.OS === 'android'
        ? fullScreenHeight - topInset - handleHeight
        : fullScreenHeight - topInset;

    /**
     * Snap points changing cause a rerender of the position,
     * this is an issue if you are calling close on the bottom sheet.
     */
    const snapPoints = useMemo(
      () => [initialSnapPoint, finalSnapPoint],
      [initialSnapPoint, finalSnapPoint],
    );

    return (
      <>
        <BottomSheet
          containerHeight={fullScreenHeight}
          enablePanDownToClose={true}
          handleComponent={
            /**
             * using `null` here instead of `style={{ opacity: photoError ? 0 : 1 }}`
             * as opacity is not an allowed style
             */
            photoError ? null : AttachmentPickerBottomSheetHandle
          }
          handleHeight={handleHeight}
          index={-1}
          onChange={setCurrentIndex}
          ref={ref}
          snapPoints={snapPoints}
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
            attachmentPickerBottomSheetHeight={attachmentPickerBottomSheetHeight}
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
