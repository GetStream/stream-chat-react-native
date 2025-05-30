import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';

import { BackHandler } from 'react-native';

import { cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';

import type BottomSheet from '@gorhom/bottom-sheet';

import { OverlayContext, OverlayProviderProps } from './OverlayContext';

import { AttachmentPicker } from '../../components/AttachmentPicker/AttachmentPicker';

import { AttachmentPickerBottomSheetHandle as DefaultAttachmentPickerBottomSheetHandle } from '../../components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle';
import { AttachmentPickerError as DefaultAttachmentPickerError } from '../../components/AttachmentPicker/components/AttachmentPickerError';
import { AttachmentPickerErrorImage as DefaultAttachmentPickerErrorImage } from '../../components/AttachmentPicker/components/AttachmentPickerErrorImage';
import { AttachmentPickerIOSSelectMorePhotos as DefaultAttachmentPickerIOSSelectMorePhotos } from '../../components/AttachmentPicker/components/AttachmentPickerIOSSelectMorePhotos';
import { AttachmentPickerSelectionBar as DefaultAttachmentPickerSelectionBar } from '../../components/AttachmentPicker/components/AttachmentPickerSelectionBar';
import { CameraSelectorIcon as DefaultCameraSelectorIcon } from '../../components/AttachmentPicker/components/CameraSelectorIcon';
import { FileSelectorIcon as DefaultFileSelectorIcon } from '../../components/AttachmentPicker/components/FileSelectorIcon';
import { ImageOverlaySelectedComponent as DefaultImageOverlaySelectedComponent } from '../../components/AttachmentPicker/components/ImageOverlaySelectedComponent';
import { ImageSelectorIcon as DefaultImageSelectorIcon } from '../../components/AttachmentPicker/components/ImageSelectorIcon';
import { VideoRecorderSelectorIcon as DefaultVideoRecorderSelectorIcon } from '../../components/AttachmentPicker/components/VideoRecorderSelectorIcon';
import { ImageGallery } from '../../components/ImageGallery/ImageGallery';
import { CreatePollIcon as DefaultCreatePollIcon } from '../../components/Poll/components/CreatePollIcon';
import { useStreami18n } from '../../hooks/useStreami18n';

import { useViewport } from '../../hooks/useViewport';
import { isImageMediaLibraryAvailable } from '../../native';

import { AttachmentPickerProvider } from '../attachmentPickerContext/AttachmentPickerContext';
import { ImageGalleryProvider } from '../imageGalleryContext/ImageGalleryContext';
import { ThemeProvider } from '../themeContext/ThemeContext';
import {
  DEFAULT_USER_LANGUAGE,
  TranslationProvider,
} from '../translationContext/TranslationContext';

/**
 * - The highest level of these components is the `OverlayProvider`. The `OverlayProvider` allows users to interact with messages on long press above the underlying views, use the full screen image viewer, and use the `AttachmentPicker` as a keyboard-esk view.
 *  Because these views must exist above all others `OverlayProvider` should wrap your navigation stack as well. Assuming [`React Navigation`](https://reactnavigation.org/) is being used, your highest level navigation stack should be wrapped in the provider:
 *
 *    ```js
 *    <NavigationContainer>
 *      <OverlayProvider>
 *        <Stack.Navigator>
 *          <Stack.Screen />
 *        </Stack.Navigator>
 *      </OverlayProvider>
 *    </NavigationContainer>
 *    ```
 *
 * - Don't forget to check our cookbook section of [OverlayProvider](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#overlayprovider)
 *
 * - Also check the [visual component guide](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#custom-components), to learn about component customizations.
 *
 * @example ./OverlayProvider.md
 */
export const OverlayProvider = (props: PropsWithChildren<OverlayProviderProps>) => {
  const { vh } = useViewport();
  const bottomSheetCloseTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const {
    AttachmentPickerBottomSheetHandle = DefaultAttachmentPickerBottomSheetHandle,
    attachmentPickerBottomSheetHandleHeight = 20,
    attachmentPickerBottomSheetHeight = vh(45),
    AttachmentPickerError = DefaultAttachmentPickerError,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage = DefaultAttachmentPickerErrorImage,
    attachmentPickerErrorText,
    AttachmentPickerIOSSelectMorePhotos = DefaultAttachmentPickerIOSSelectMorePhotos,
    AttachmentPickerSelectionBar = DefaultAttachmentPickerSelectionBar,
    attachmentSelectionBarHeight = 52,
    autoPlayVideo,
    bottomInset,
    CameraSelectorIcon = DefaultCameraSelectorIcon,
    children,
    closePicker = (ref) => {
      if (ref.current?.close) {
        if (bottomSheetCloseTimeoutRef.current) {
          clearTimeout(bottomSheetCloseTimeoutRef.current);
        }
        ref.current.close();
        // Attempt to close the bottomsheet again to circumvent accidental opening on Android.
        // Details: This to prevent a race condition where the close function is called during the point when a internal container layout happens within the bottomsheet due to keyboard affecting the layout
        // If the container layout measures a shorter height than previous but if the close snapped to the previous height's position, the bottom sheet will show up
        // this short delay ensures that close function is always called after a container layout due to keyboard change
        // NOTE: this timeout has to be above 500 as the keyboardAnimationDuration is 500 in the bottomsheet library - see src/hooks/useKeyboard.ts there for more details
        bottomSheetCloseTimeoutRef.current = setTimeout(() => {
          ref.current?.close();
        }, 600);
      }
    },
    CreatePollIcon = DefaultCreatePollIcon,
    FileSelectorIcon = DefaultFileSelectorIcon,
    giphyVersion,
    i18nInstance,
    imageGalleryCustomComponents,
    imageGalleryGridHandleHeight = 40,
    imageGalleryGridSnapPoints,
    ImageOverlaySelectedComponent = DefaultImageOverlaySelectedComponent,
    ImageSelectorIcon = DefaultImageSelectorIcon,
    numberOfAttachmentImagesToLoadPerCall,
    numberOfAttachmentPickerImageColumns,
    numberOfImageGalleryGridColumns,
    openPicker = (ref) => {
      if (bottomSheetCloseTimeoutRef.current) {
        clearTimeout(bottomSheetCloseTimeoutRef.current);
      }
      if (ref.current?.snapToIndex) {
        ref.current.snapToIndex(0);
      } else {
        console.warn('bottom and top insets must be set for the image picker to work correctly');
      }
    },
    topInset,
    value,
    VideoRecorderSelectorIcon = DefaultVideoRecorderSelectorIcon,
  } = props;

  const attachmentPickerProps = {
    AttachmentPickerBottomSheetHandle,
    attachmentPickerBottomSheetHandleHeight,
    attachmentPickerBottomSheetHeight,
    AttachmentPickerError,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage,
    attachmentPickerErrorText,
    AttachmentPickerIOSSelectMorePhotos,
    attachmentSelectionBarHeight,
    ImageOverlaySelectedComponent,
    numberOfAttachmentImagesToLoadPerCall,
    numberOfAttachmentPickerImageColumns,
  };

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [overlay, setOverlay] = useState(value?.overlay || 'none');

  const overlayOpacity = useSharedValue(0);

  // Setup translators
  const translators = useStreami18n(i18nInstance);

  useEffect(() => {
    const backAction = () => {
      if (overlay !== 'none') {
        setOverlay('none');
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [overlay]);

  useEffect(
    () =>
      // cleanup the timeout if the component unmounts
      () => {
        if (bottomSheetCloseTimeoutRef.current) {
          clearTimeout(bottomSheetCloseTimeoutRef.current);
        }
      },
    [],
  );

  useEffect(() => {
    closePicker(bottomSheetRef);
    cancelAnimation(overlayOpacity);
    if (overlay !== 'none') {
      overlayOpacity.value = withTiming(1);
    } else {
      overlayOpacity.value = withTiming(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  const attachmentPickerContext = {
    AttachmentPickerBottomSheetHandle,
    attachmentPickerBottomSheetHeight,
    AttachmentPickerSelectionBar,
    attachmentSelectionBarHeight,
    bottomInset,
    CameraSelectorIcon,
    closePicker: () => closePicker(bottomSheetRef),
    CreatePollIcon,
    FileSelectorIcon,
    ImageSelectorIcon,
    openPicker: () => openPicker(bottomSheetRef),
    topInset,
    VideoRecorderSelectorIcon,
  };

  const overlayContext = {
    overlay,
    setOverlay,
    style: value?.style,
  };

  return (
    <TranslationProvider value={{ ...translators, userLanguage: DEFAULT_USER_LANGUAGE }}>
      <OverlayContext.Provider value={overlayContext}>
        <AttachmentPickerProvider value={attachmentPickerContext}>
          <ImageGalleryProvider>
            <ThemeProvider style={overlayContext.style}>
              {children}
              {overlay === 'gallery' && (
                <ImageGallery
                  autoPlayVideo={autoPlayVideo}
                  giphyVersion={giphyVersion}
                  imageGalleryCustomComponents={imageGalleryCustomComponents}
                  imageGalleryGridHandleHeight={imageGalleryGridHandleHeight}
                  imageGalleryGridSnapPoints={imageGalleryGridSnapPoints}
                  numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
                  overlayOpacity={overlayOpacity}
                />
              )}
              {isImageMediaLibraryAvailable() ? (
                <AttachmentPicker ref={bottomSheetRef} {...attachmentPickerProps} />
              ) : null}
            </ThemeProvider>
          </ImageGalleryProvider>
        </AttachmentPickerProvider>
      </OverlayContext.Provider>
    </TranslationProvider>
  );
};
