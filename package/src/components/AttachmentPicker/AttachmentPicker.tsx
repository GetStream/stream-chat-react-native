import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet } from 'react-native';

import BottomSheetOriginal from '@gorhom/bottom-sheet';
import type { BottomSheetHandleProps } from '@gorhom/bottom-sheet';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import type { AttachmentPickerErrorProps } from './components/AttachmentPickerError';

import { renderAttachmentPickerItem } from './components/AttachmentPickerItem';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { MessageInputContextValue } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useScreenDimensions } from '../../hooks/useScreenDimensions';
import { NativeHandlers } from '../../native';
import type { File } from '../../types/types';
import { BottomSheet } from '../BottomSheetCompatibility/BottomSheet';
import { BottomSheetFlatList } from '../BottomSheetCompatibility/BottomSheetFlatList';

dayjs.extend(duration);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});

export type AttachmentPickerProps = Pick<
  MessageInputContextValue,
  | 'AttachmentPickerBottomSheetHandle'
  | 'attachmentPickerBottomSheetHandleHeight'
  | 'attachmentSelectionBarHeight'
  | 'attachmentPickerBottomSheetHeight'
> & {
  /**
   * Custom UI component to render error component while opening attachment picker.
   *
   * **Default**
   * [AttachmentPickerError](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerError.tsx)
   */
  AttachmentPickerError: React.ComponentType<AttachmentPickerErrorProps>;
  /**
   * Custom UI component to render error image for attachment picker
   *
   * **Default**
   * [AttachmentPickerErrorImage](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerErrorImage.tsx)
   */
  AttachmentPickerErrorImage: React.ComponentType;
  /**
   * Custom UI Component to render select more photos for selected gallery access in iOS.
   */
  AttachmentPickerIOSSelectMorePhotos: React.ComponentType;
  /**
   * Custom UI component to render overlay component, that shows up on top of [selected
   * image](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png) (with tick mark)
   *
   * **Default**
   * [ImageOverlaySelectedComponent](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/ImageOverlaySelectedComponent.tsx)
   */
  ImageOverlaySelectedComponent: React.ComponentType;
  attachmentPickerErrorButtonText?: string;
  attachmentPickerErrorText?: string;
  numberOfAttachmentImagesToLoadPerCall?: number;
  numberOfAttachmentPickerImageColumns?: number;
};

export const AttachmentPicker = React.forwardRef(
  (props: AttachmentPickerProps, ref: React.ForwardedRef<BottomSheetOriginal>) => {
    const {
      AttachmentPickerBottomSheetHandle,
      attachmentPickerBottomSheetHandleHeight,
      attachmentPickerBottomSheetHeight,
      AttachmentPickerError,
      attachmentPickerErrorButtonText,
      AttachmentPickerErrorImage,
      attachmentPickerErrorText,
      AttachmentPickerIOSSelectMorePhotos,
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
    const { closePicker, selectedPicker, setSelectedPicker, topInset } =
      useAttachmentPickerContext();
    const { vh: screenVh } = useScreenDimensions();

    const fullScreenHeight = screenVh(100);

    const [currentIndex, setCurrentIndex] = useState(-1);
    const endCursorRef = useRef<string>(undefined);
    const [photoError, setPhotoError] = useState(false);
    const [iOSLimited, setIosLimited] = useState(false);
    const hasNextPageRef = useRef(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
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
          if (!NativeHandlers.getPhotos) {
            setPhotos([]);
            setIosLimited(false);
            return;
          }
          const results = await NativeHandlers.getPhotos({
            after: endCursor,
            first: numberOfAttachmentImagesToLoadPerCall ?? 60,
          });
          endCursorRef.current = results.endCursor;
          setPhotos((prevPhotos) =>
            endCursor ? [...prevPhotos, ...results.assets] : results.assets,
          );
          setIosLimited(results.iOSLimited);
          hasNextPageRef.current = !!results.hasNextPage;
        } catch (error) {
          setPhotoError(true);
        }
        setLoadingPhotos(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, selectedPicker, loadingPhotos]);

    // we need to use ref here to avoid running effect when getMorePhotos changes
    const getMorePhotosRef = useRef(getMorePhotos);
    getMorePhotosRef.current = getMorePhotos;

    useEffect(() => {
      if (selectedPicker !== 'images') {
        return;
      }

      if (!NativeHandlers.oniOS14GalleryLibrarySelectionChange) {
        return;
      }
      // ios 14 library selection change event is fired when user reselects the images that are permitted to be
      // readable by the app
      const { unsubscribe } = NativeHandlers.oniOS14GalleryLibrarySelectionChange(() => {
        // we reset the cursor and has next page to true to facilitate fetching of the first page of photos again
        hasNextPageRef.current = true;
        endCursorRef.current = undefined;
        // fetch the first page of photos again
        getMorePhotosRef.current();
      });
      return unsubscribe;
    }, [selectedPicker]);

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
    }, [selectedPicker, closePicker, setSelectedPicker]);

    useEffect(() => {
      const onKeyboardOpenHandler = () => {
        if (selectedPicker) {
          setSelectedPicker(undefined);
        }
        closePicker();
      };
      const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const keyboardSubscription = Keyboard.addListener(keyboardShowEvent, onKeyboardOpenHandler);

      return () => {
        // Following if-else condition to avoid deprecated warning coming RN 0.65
        if (keyboardSubscription?.remove) {
          keyboardSubscription.remove();
          return;
        }
        // @ts-ignore
        else if (Keyboard.removeListener) {
          // @ts-ignore
          Keyboard.removeListener(keyboardShowEvent, onKeyboardOpenHandler);
        }
      };
    }, [closePicker, selectedPicker, setSelectedPicker]);

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // we do this only once on open for avoiding to request permissions in rationale dialog again and again on
        // Android
        attemptedToLoadPhotosOnOpenRef.current = true;
      }
    }, [currentIndex, selectedPicker, getMorePhotos, loadingPhotos]);

    const selectedPhotos = useMemo(
      () =>
        photos.map((asset) => ({
          asset,
          ImageOverlaySelectedComponent,
          numberOfAttachmentPickerImageColumns,
        })),
      [photos, ImageOverlaySelectedComponent, numberOfAttachmentPickerImageColumns],
    );

    const handleHeight = attachmentPickerBottomSheetHandleHeight;

    const initialSnapPoint = attachmentPickerBottomSheetHeight;

    const finalSnapPoint = fullScreenHeight - topInset;

    /**
     * Snap points changing cause a rerender of the position,
     * this is an issue if you are calling close on the bottom sheet.
     */
    const snapPoints = [initialSnapPoint, finalSnapPoint];

    const MemoizedAttachmentPickerBottomSheetHandle = useCallback(
      (props: BottomSheetHandleProps) =>
        /**
         * using `null` here instead of `style={{ opacity: photoError ? 0 : 1 }}`
         * as opacity is not an allowed style
         */
        !photoError && AttachmentPickerBottomSheetHandle ? (
          <AttachmentPickerBottomSheetHandle {...props} />
        ) : null,
      [AttachmentPickerBottomSheetHandle, photoError],
    );

    return (
      <>
        <BottomSheet
          enablePanDownToClose={true}
          handleComponent={MemoizedAttachmentPickerBottomSheetHandle}
          // @ts-ignore
          handleHeight={handleHeight}
          index={-1}
          onChange={setCurrentIndex}
          ref={ref}
          snapPoints={snapPoints}
        >
          {iOSLimited && <AttachmentPickerIOSSelectMorePhotos />}
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
            onEndReached={photoError ? undefined : getMorePhotos}
            renderItem={renderAttachmentPickerItem}
            testID={'attachment-picker-list'}
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
