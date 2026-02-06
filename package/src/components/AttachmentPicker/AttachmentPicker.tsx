import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, EmitterSubscription, Keyboard, Platform, StyleSheet } from 'react-native';

import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import BottomSheetOriginal from '@gorhom/bottom-sheet';
import type { BottomSheetHandleProps } from '@gorhom/bottom-sheet';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import type { AttachmentPickerErrorProps } from './components/AttachmentPickerError';

import { renderAttachmentPickerItem } from './components/AttachmentPickerItem';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { MessageInputContextValue } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { useAttachmentPickerState } from '../../hooks/useAttachmentPickerState';
import { useScreenDimensions } from '../../hooks/useScreenDimensions';
import { NativeHandlers } from '../../native';
import { SelectedPickerType } from '../../state-store/attachment-picker-store';
import type { File } from '../../types/types';
import { BottomSheet } from '../BottomSheetCompatibility/BottomSheet';
import { BottomSheetFlatList } from '../BottomSheetCompatibility/BottomSheetFlatList';
import { KeyboardControllerPackage } from '../KeyboardCompatibleView/KeyboardControllerAvoidingView';

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
  attachmentPickerErrorButtonText?: string;
  attachmentPickerErrorText?: string;
  numberOfAttachmentImagesToLoadPerCall?: number;
};

const keyExtractor = (item: File) => item.uri;

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
      numberOfAttachmentImagesToLoadPerCall,
    } = props;

    const {
      theme: {
        attachmentPicker: { bottomSheetContentContainer },
        colors: { white },
      },
    } = useTheme();
    const { closePicker, attachmentPickerStore, topInset, numberOfAttachmentPickerImageColumns } =
      useAttachmentPickerContext();
    const { selectedPicker } = useAttachmentPickerState();
    const { vh: screenVh } = useScreenDimensions();

    const fullScreenHeight = screenVh(100);

    const [currentIndex, setCurrentIndexInternal] = useState(-1);
    const currentIndexRef = useRef<number>(currentIndex);
    const setCurrentIndex = useStableCallback((_: number, toIndex: number) => {
      setCurrentIndexInternal(toIndex);
      currentIndexRef.current = toIndex;
    });
    const endCursorRef = useRef<string>(undefined);
    const [photoError, setPhotoError] = useState(false);
    const [iOSLimited, setIosLimited] = useState(false);
    const hasNextPageRef = useRef(true);
    const loadingPhotosRef = useRef(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const attemptedToLoadPhotosOnOpenRef = useRef<boolean>(false);

    const getMorePhotos = useStableCallback(async () => {
      if (
        hasNextPageRef.current &&
        !loadingPhotosRef.current &&
        currentIndex > -1 &&
        selectedPicker === 'images'
      ) {
        setPhotoError(false);
        loadingPhotosRef.current = true;
        const endCursor = endCursorRef.current;
        try {
          if (!NativeHandlers.getPhotos) {
            setPhotos([]);
            setIosLimited(false);
            return;
          }

          const results = await NativeHandlers.getPhotos({
            after: endCursor,
            first: numberOfAttachmentImagesToLoadPerCall ?? 25,
          });

          endCursorRef.current = results.endCursor;
          // skip updating if the sheet closed in the meantime, to avoid
          // confusing the bottom sheet internals
          setPhotos((prevPhotos) => {
            if (endCursor) {
              return [...prevPhotos, ...results.assets];
            }

            for (let i = 0; i < results.assets.length; i++) {
              if (results.assets[i].uri !== prevPhotos[i]?.uri) {
                return results.assets;
              }
            }

            return prevPhotos.slice(0, results.assets.length);
          });
          setIosLimited(results.iOSLimited);
          hasNextPageRef.current = !!results.hasNextPage;
        } catch (error) {
          setPhotoError(true);
        }
        loadingPhotosRef.current = false;
      }
    });

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
        getMorePhotos();
      });
      return unsubscribe;
    }, [getMorePhotos, selectedPicker]);

    useEffect(() => {
      const backAction = () => {
        if (attachmentPickerStore.state.getLatestValue().selectedPicker) {
          attachmentPickerStore.setSelectedPicker(undefined);
          closePicker();
          return true;
        }

        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }, [attachmentPickerStore, closePicker]);

    useEffect(() => {
      const onKeyboardOpenHandler = () => {
        if (attachmentPickerStore.state.getLatestValue().selectedPicker) {
          attachmentPickerStore.setSelectedPicker(undefined);
        }
        closePicker();
      };
      let keyboardSubscription: EmitterSubscription | null = null;
      if (KeyboardControllerPackage?.KeyboardEvents) {
        keyboardSubscription = KeyboardControllerPackage.KeyboardEvents.addListener(
          'keyboardWillShow',
          onKeyboardOpenHandler,
        );
      } else {
        const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        keyboardSubscription = Keyboard.addListener(keyboardShowEvent, onKeyboardOpenHandler);
      }
      return () => {
        keyboardSubscription?.remove();
      };
    }, [attachmentPickerStore, closePicker]);

    useEffect(() => {
      if (currentIndex < 0) {
        attachmentPickerStore.setSelectedPicker(undefined);
        if (!loadingPhotosRef.current) {
          endCursorRef.current = undefined;
          hasNextPageRef.current = true;
          attemptedToLoadPhotosOnOpenRef.current = false;
          setPhotoError(false);
        }
      }
    }, [currentIndex, attachmentPickerStore]);

    useEffect(() => {
      if (
        !attemptedToLoadPhotosOnOpenRef.current &&
        selectedPicker === 'images' &&
        endCursorRef.current === undefined &&
        currentIndex > -1 &&
        !loadingPhotosRef.current
      ) {
        getMorePhotos();
        // we do this only once on open for avoiding to request permissions in rationale dialog again and again on
        // Android
        attemptedToLoadPhotosOnOpenRef.current = true;
      }
    }, [currentIndex, selectedPicker, getMorePhotos]);

    const handleHeight = attachmentPickerBottomSheetHandleHeight;

    const initialSnapPoint = attachmentPickerBottomSheetHeight;

    const finalSnapPoint = fullScreenHeight - topInset;

    /**
     * Snap points changing cause a rerender of the position,
     * this is an issue if you are calling close on the bottom sheet.
     */
    const snapPoints = useMemo(
      () => [initialSnapPoint, finalSnapPoint],
      [initialSnapPoint, finalSnapPoint],
    );

    const numberOfColumns = numberOfAttachmentPickerImageColumns ?? 3;

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

    const animatedIndex = useSharedValue(currentIndex);
    const setSelectedPickerWithDebounce = useStableCallback((value: SelectedPickerType) =>
      attachmentPickerStore.setSelectedPicker(value, true),
    );

    // On some occasions, onAnimate does not fire whenever we pan to close the
    // bottom sheet, likely due to physics giving the pan enough momentum for
    // automatic animation to not be needed. To cover those cases, we react to
    // the animatedIndex shared value to make sure we do proper cleanup.
    useAnimatedReaction(
      () => animatedIndex.value,
      (currentIndex, previousIndex) => {
        if (currentIndex !== previousIndex && currentIndex === -1) {
          runOnJS(setSelectedPickerWithDebounce)(undefined);
        }
      },
    );

    return (
      <>
        <BottomSheet
          enablePanDownToClose={true}
          handleComponent={MemoizedAttachmentPickerBottomSheetHandle}
          // @ts-ignore
          handleHeight={handleHeight}
          index={currentIndex}
          onAnimate={setCurrentIndex}
          ref={ref}
          snapPoints={snapPoints}
          animatedIndex={animatedIndex}
        >
          {iOSLimited && <AttachmentPickerIOSSelectMorePhotos />}
          <BottomSheetFlatList
            contentContainerStyle={[
              styles.container,
              { backgroundColor: white, opacity: photoError ? 0 : 1 },
              bottomSheetContentContainer,
            ]}
            data={photos}
            keyExtractor={keyExtractor}
            numColumns={numberOfColumns}
            onEndReached={photoError ? undefined : getMorePhotos}
            renderItem={renderAttachmentPickerItem}
            testID={'attachment-picker-list'}
            updateCellsBatchingPeriod={16}
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
