import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  EmitterSubscription,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  Text,
} from 'react-native';

import { useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { renderAttachmentPickerItem } from './components/AttachmentPickerItem';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { useAttachmentPickerState } from '../../hooks/useAttachmentPickerState';
import { NativeHandlers } from '../../native';
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

export const IOS_LIMITED_DEEPLINK = '@getstream/ios-limited-button' as const;

export type IosLimitedItemType = { uri: typeof IOS_LIMITED_DEEPLINK };

export type PhotoContentItemType = File | IosLimitedItemType;

export const isIosLimited = (item: PhotoContentItemType): item is IosLimitedItemType =>
  'uri' in item && item.uri === '@getstream/ios-limited-button';

const keyExtractor = (item: PhotoContentItemType) => item.uri;

const SPRING_CONFIG = {
  damping: 80,
  overshootClamping: true,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
  stiffness: 500,
  duration: 200,
};

export const AttachmentPicker = () => {
  const {
    theme: {
      semantics,
      attachmentPicker: { bottomSheetContentContainer },
      messageInput: { attachmentSelectionBar },
      colors: { white },
    },
  } = useTheme();
  const {
    closePicker,
    attachmentPickerStore,
    numberOfAttachmentPickerImageColumns,
    AttachmentPickerSelectionBar,
    attachmentPickerBottomSheetHeight,
    AttachmentPickerError,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage,
    attachmentPickerErrorText,
    numberOfAttachmentImagesToLoadPerCall,
    bottomSheetRef: ref,
  } = useAttachmentPickerContext();
  const { attachmentSelectionBarHeight } = useMessageInputContext();
  const { selectedPicker } = useAttachmentPickerState();

  const [currentIndex, setCurrentIndexInternal] = useState(-1);
  const currentIndexRef = useRef<number>(currentIndex);
  const setCurrentIndex = useStableCallback((_: number, toIndex: number) => {
    setCurrentIndexInternal(toIndex);
    currentIndexRef.current = toIndex;
  });
  const endCursorRef = useRef<string>(undefined);
  const [photoError, setPhotoError] = useState(false);
  const hasNextPageRef = useRef(true);
  const loadingPhotosRef = useRef(false);
  const [photos, setPhotos] = useState<Array<PhotoContentItemType>>([]);
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

          let assets: PhotoContentItemType[] = results.assets;

          if (results.iOSLimited) {
            assets = [{ uri: IOS_LIMITED_DEEPLINK }, ...assets];
          }

          for (let i = 0; i < results.assets.length; i++) {
            if (assets[i].uri !== prevPhotos[i]?.uri) {
              return assets;
            }
          }

          return prevPhotos.slice(0, assets.length);
        });
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

  const initialSnapPoint = attachmentPickerBottomSheetHeight;

  /**
   * Snap points changing cause a rerender of the position,
   * this is an issue if you are calling close on the bottom sheet.
   */
  const snapPoints = useMemo(() => [initialSnapPoint], [initialSnapPoint]);

  const numberOfColumns = numberOfAttachmentPickerImageColumns ?? 3;

  const Handle = useCallback(
    () => (
      <View
        style={[
          {
            backgroundColor: semantics.composerBg,
            height: attachmentSelectionBarHeight,
          },
          attachmentSelectionBar,
        ]}
      >
        <AttachmentPickerSelectionBar />
      </View>
    ),
    [
      AttachmentPickerSelectionBar,
      attachmentSelectionBar,
      attachmentSelectionBarHeight,
      semantics.composerBg,
    ],
  );

  // TODO V9: Think of a better way to do this. This is just a temporary fix.
  const lastSelectedPickerRef = useRef(selectedPicker);
  if (selectedPicker) {
    lastSelectedPickerRef.current = selectedPicker;
  }

  const animationConfigs = useBottomSheetSpringConfigs(SPRING_CONFIG);

  return (
    <BottomSheet
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      enableDynamicSizing={false}
      handleComponent={Handle}
      index={currentIndex}
      onAnimate={setCurrentIndex}
      // @ts-ignore
      ref={ref}
      snapPoints={snapPoints}
      animationConfigs={animationConfigs}
    >
      {lastSelectedPickerRef.current === 'images' ? (
        photoError ? (
          <AttachmentPickerError
            attachmentPickerBottomSheetHeight={
              attachmentPickerBottomSheetHeight - attachmentSelectionBarHeight
            }
            attachmentPickerErrorButtonText={attachmentPickerErrorButtonText}
            AttachmentPickerErrorImage={AttachmentPickerErrorImage}
            attachmentPickerErrorText={attachmentPickerErrorText}
          />
        ) : (
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
        )
      ) : (
        // TODO V9: Remove these inline styles
        <View
          style={{
            width: '100%',
            height: attachmentPickerBottomSheetHeight - attachmentSelectionBarHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text>{lastSelectedPickerRef.current}</Text>
        </View>
      )}
    </BottomSheet>
  );
};

AttachmentPicker.displayName = 'AttachmentPicker';
