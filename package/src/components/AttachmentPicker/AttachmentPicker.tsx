import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Dimensions, Keyboard, Platform, StatusBar, StyleSheet } from 'react-native';

import BottomSheet, { BottomSheetFlatList, BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import type { AttachmentPickerErrorProps } from './components/AttachmentPickerError';

import { renderAttachmentPickerItem } from './components/AttachmentPickerItem';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { getPhotos } from '../../native';
import type { Asset } from '../../types/types';
import { vh } from '../../utils/utils';

dayjs.extend(duration);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});

const screenHeight = vh(100);
const fullScreenHeight = Dimensions.get('window').height;

export type AttachmentPickerProps = {
  /**
   * Custom UI component to render [draggable handle](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png) of attachment picker.
   *
   * **Default** [AttachmentPickerBottomSheetHandle](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle.tsx)
   */
  AttachmentPickerBottomSheetHandle: React.FC<BottomSheetHandleProps>;
  /**
   * Custom UI component to render error component while opening attachment picker.
   *
   * **Default** [AttachmentPickerError](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerError.tsx)
   */
  AttachmentPickerError: React.ComponentType<AttachmentPickerErrorProps>;
  /**
   * Custom UI component to render error image for attachment picker
   *
   * **Default** [AttachmentPickerErrorImage](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerErrorImage.tsx)
   */
  AttachmentPickerErrorImage: React.ComponentType;
  /**
   * Custom UI component to render overlay component, that shows up on top of [selected image](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png) (with tick mark)
   *
   * **Default** [ImageOverlaySelectedComponent](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/ImageOverlaySelectedComponent.tsx)
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
      selectedFiles,
      selectedImages,
      selectedPicker,
      setSelectedFiles,
      setSelectedImages,
      setSelectedPicker,
      topInset,
    } = useAttachmentPickerContext();

    const [currentIndex, setCurrentIndex] = useState(-1);
    const endCursorRef = useRef<string>();
    const [photoError, setPhotoError] = useState(false);
    const hasNextPageRef = useRef(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [photos, setPhotos] = useState<Asset[]>([]);
    const attemptedToLoadPhotosOnOpenRef = useRef(false);

    const getMorePhotos = useCallback(async () => {
      if (
        hasNextPageRef.current &&
        !loadingPhotos &&
        currentIndex > -1 &&
        selectedPicker === 'images'
      ) {
        setPhotoError(false);
        setLoadingPhotos(true);
        const endCursor = endCursorRef.current;
        try {
          const results = await getPhotos({
            after: endCursor,
            first: numberOfAttachmentImagesToLoadPerCall ?? 60,
          });
          endCursorRef.current = results.endCursor;
          setPhotos((prevPhotos) =>
            endCursor ? [...prevPhotos, ...results.assets] : results.assets,
          );
          hasNextPageRef.current = !!results.hasNextPage;
        } catch (error) {
          setPhotoError(true);
        }
        setLoadingPhotos(false);
      }
    }, [currentIndex, selectedPicker, loadingPhotos]);

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
    }, [selectedPicker, closePicker]);

    useEffect(() => {
      const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const keyboardSubscription = Keyboard.addListener(keyboardShowEvent, closePicker);

      return () => {
        if (keyboardSubscription?.remove) {
          keyboardSubscription.remove();
          return;
        }

        // To keep compatibility with older versions of React Native, where `remove()` is not available
        Keyboard.removeListener(keyboardShowEvent, closePicker);
      };
    }, [closePicker]);

    useEffect(() => {
      if (currentIndex < 0) {
        setSelectedPicker(undefined);
        if (!loadingPhotos) {
          endCursorRef.current = undefined;
          hasNextPageRef.current = true;
          attemptedToLoadPhotosOnOpenRef.current = false;
          setPhotoError(false);
        }
      }
    }, [currentIndex, loadingPhotos]);

    useEffect(() => {
      if (
        !attemptedToLoadPhotosOnOpenRef.current &&
        selectedPicker === 'images' &&
        endCursorRef.current === undefined &&
        currentIndex > -1 &&
        !loadingPhotos
      ) {
        getMorePhotos();
        // we do this only once on open for avoiding to request permissions in rationale dialog again and again on Android
        attemptedToLoadPhotosOnOpenRef.current = true;
      }
    }, [currentIndex, selectedPicker, getMorePhotos, loadingPhotos]);

    const selectedPhotos = photos.map((asset) => ({
      asset,
      ImageOverlaySelectedComponent,
      maxNumberOfFiles,
      numberOfAttachmentPickerImageColumns,
      numberOfUploads: selectedFiles.length + selectedImages.length,
      selected:
        selectedImages.some((image) => image.uri === asset.uri) ||
        selectedFiles.some((file) => file.uri === asset.uri),
      setSelectedFiles,
      setSelectedImages,
    }));

    const handleHeight = attachmentPickerBottomSheetHandleHeight || 20;

    /**
     * This is to handle issues with Android measurements coming back incorrect.
     * If the StatusBar height is perfectly 1/2 of the difference between the two
     * dimensions for screen and window, it is incorrect and we need to account for
     * this. If you use a translucent header bar more adjustments are needed.
     */
    const getAndroidBottomBarHeightAdjustment = (): number => {
      if (Platform.OS === 'android') {
        const statusBarHeight = StatusBar.currentHeight ?? 0;
        const bottomBarHeight = fullScreenHeight - screenHeight - statusBarHeight;
        if (bottomBarHeight === statusBarHeight) {
          return translucentStatusBar ? 0 : statusBarHeight;
        } else {
          if (translucentStatusBar) {
            if (bottomBarHeight > statusBarHeight) {
              return -bottomBarHeight + statusBarHeight;
            } else {
              return bottomBarHeight > 0 ? -statusBarHeight : 0;
            }
          } else {
            return bottomBarHeight > 0 ? 0 : statusBarHeight;
          }
        }
      }
      return 0;
    };

    const getInitialSnapPoint = (): number => {
      if (attachmentPickerBottomSheetHeight !== undefined) {
        return attachmentPickerBottomSheetHeight;
      }
      if (Platform.OS === 'android') {
        return (
          308 +
          (fullScreenHeight - screenHeight + getAndroidBottomBarHeightAdjustment()) -
          handleHeight
        );
      } else {
        return 308 + (fullScreenHeight - screenHeight);
      }
    };

    const initialSnapPoint = getInitialSnapPoint();

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
            renderItem={renderAttachmentPickerItem}
          />
        </BottomSheet>
        {selectedPicker === 'images' && photoError && (
          <AttachmentPickerError
            attachmentPickerBottomSheetHeight={initialSnapPoint}
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
