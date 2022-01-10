import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, StyleSheet, ViewStyle } from 'react-native';

import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type BottomSheet from '@gorhom/bottom-sheet';
import Dayjs from 'dayjs';

import { OverlayContext, OverlayProviderProps } from './OverlayContext';

import { AttachmentPicker } from '../../components/AttachmentPicker/AttachmentPicker';

import { AttachmentPickerBottomSheetHandle as DefaultAttachmentPickerBottomSheetHandle } from '../../components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle';
import { AttachmentPickerError as DefaultAttachmentPickerError } from '../../components/AttachmentPicker/components/AttachmentPickerError';
import { AttachmentPickerErrorImage as DefaultAttachmentPickerErrorImage } from '../../components/AttachmentPicker/components/AttachmentPickerErrorImage';
import { CameraSelectorIcon as DefaultCameraSelectorIcon } from '../../components/AttachmentPicker/components/CameraSelectorIcon';
import { FileSelectorIcon as DefaultFileSelectorIcon } from '../../components/AttachmentPicker/components/FileSelectorIcon';
import { ImageOverlaySelectedComponent as DefaultImageOverlaySelectedComponent } from '../../components/AttachmentPicker/components/ImageOverlaySelectedComponent';
import { ImageSelectorIcon as DefaultImageSelectorIcon } from '../../components/AttachmentPicker/components/ImageSelectorIcon';
import { ImageGallery } from '../../components/ImageGallery/ImageGallery';
import { MessageOverlay } from '../../components/MessageOverlay/MessageOverlay';
import { OverlayBackdrop } from '../../components/MessageOverlay/OverlayBackdrop';
import { ChannelsStateProvider } from '../../contexts/channelsStateContext/ChannelsStateContext';
import { useStreami18n } from '../../hooks/useStreami18n';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';
import { AttachmentPickerProvider } from '../attachmentPickerContext/AttachmentPickerContext';
import { ImageGalleryProvider } from '../imageGalleryContext/ImageGalleryContext';
import { MessageOverlayProvider } from '../messageOverlayContext/MessageOverlayContext';
import { ThemeProvider } from '../themeContext/ThemeContext';
import {
  TranslationContextValue,
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
export const OverlayProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: PropsWithChildren<OverlayProviderProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const {
    AttachmentPickerBottomSheetHandle = DefaultAttachmentPickerBottomSheetHandle,
    attachmentPickerBottomSheetHandleHeight,
    attachmentPickerBottomSheetHeight,
    AttachmentPickerError = DefaultAttachmentPickerError,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage = DefaultAttachmentPickerErrorImage,
    attachmentPickerErrorText,
    attachmentSelectionBarHeight,
    bottomInset,
    CameraSelectorIcon = DefaultCameraSelectorIcon,
    children,
    closePicker = (ref) => {
      if (ref.current) {
        ref.current.close();
      }
    },
    FileSelectorIcon = DefaultFileSelectorIcon,
    i18nInstance,
    imageGalleryCustomComponents,
    imageGalleryGridHandleHeight,
    imageGalleryGridSnapPoints,
    ImageOverlaySelectedComponent = DefaultImageOverlaySelectedComponent,
    ImageSelectorIcon = DefaultImageSelectorIcon,
    MessageActionList,
    MessageActionListItem,
    messageTextNumberOfLines,
    numberOfAttachmentImagesToLoadPerCall,
    numberOfAttachmentPickerImageColumns,
    numberOfImageGalleryGridColumns,
    openPicker = (ref) => {
      if (ref.current?.snapTo) {
        ref.current.snapTo(0);
      } else {
        console.warn('bottom and top insets must be set for the image picker to work correctly');
      }
    },
    topInset,
    translucentStatusBar,
    OverlayReactionList,
    OverlayReactions,
    value,
  } = props;

  const attachmentPickerProps = {
    AttachmentPickerBottomSheetHandle,
    attachmentPickerBottomSheetHandleHeight,
    attachmentPickerBottomSheetHeight,
    AttachmentPickerError,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage,
    attachmentPickerErrorText,
    attachmentSelectionBarHeight,
    ImageOverlaySelectedComponent,
    numberOfAttachmentImagesToLoadPerCall,
    numberOfAttachmentPickerImageColumns,
    translucentStatusBar,
  };

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: (input?: string | number | Date) => Dayjs(input),
  });
  const [overlay, setOverlay] = useState(value?.overlay || 'none');

  const overlayOpacity = useSharedValue(0);
  const { height, width } = Dimensions.get('screen');

  // Setup translators
  const loadingTranslators = useStreami18n({ i18nInstance, setTranslators });

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

  useEffect(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close?.();
    }
    cancelAnimation(overlayOpacity);
    if (overlay !== 'none') {
      overlayOpacity.value = withTiming(1);
    } else {
      overlayOpacity.value = withTiming(0);
    }
  }, [overlay]);

  // Setup translators
  useStreami18n({ i18nInstance, setTranslators });

  const attachmentPickerContext = {
    attachmentPickerBottomSheetHeight,
    attachmentSelectionBarHeight,
    bottomInset,
    CameraSelectorIcon,
    closePicker: () => closePicker(bottomSheetRef),
    FileSelectorIcon,
    ImageSelectorIcon,
    openPicker: () => openPicker(bottomSheetRef),
    topInset,
  };

  const overlayStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: overlayOpacity.value,
    }),
    [],
  );

  const overlayContext = {
    overlay,
    setOverlay,
    style: value?.style,
    translucentStatusBar,
  };

  if (loadingTranslators) return null;

  return (
    <TranslationProvider value={translators}>
      <OverlayContext.Provider value={overlayContext}>
        <MessageOverlayProvider<At, Ch, Co, Ev, Me, Re, Us>>
          <AttachmentPickerProvider value={attachmentPickerContext}>
            <ImageGalleryProvider>
              <ChannelsStateProvider<At, Ch, Co, Ev, Me, Re, Us>>{children}</ChannelsStateProvider>
              <ThemeProvider style={overlayContext.style}>
                <Animated.View
                  pointerEvents={overlay === 'none' ? 'none' : 'auto'}
                  style={[StyleSheet.absoluteFill, overlayStyle]}
                >
                  <OverlayBackdrop style={[StyleSheet.absoluteFill, { height, width }]} />
                </Animated.View>
                {overlay === 'message' && (
                  <MessageOverlay<At, Ch, Co, Ev, Me, Re, Us>
                    MessageActionList={MessageActionList}
                    MessageActionListItem={MessageActionListItem}
                    messageTextNumberOfLines={messageTextNumberOfLines}
                    overlayOpacity={overlayOpacity}
                    OverlayReactionList={OverlayReactionList}
                    OverlayReactions={OverlayReactions}
                    visible={overlay === 'message'}
                  />
                )}
                <ImageGallery<At, Ch, Co, Ev, Me, Re, Us>
                  imageGalleryCustomComponents={imageGalleryCustomComponents}
                  imageGalleryGridHandleHeight={imageGalleryGridHandleHeight}
                  imageGalleryGridSnapPoints={imageGalleryGridSnapPoints}
                  numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
                  overlayOpacity={overlayOpacity}
                  visible={overlay === 'gallery'}
                />
                <AttachmentPicker ref={bottomSheetRef} {...attachmentPickerProps} />
              </ThemeProvider>
            </ImageGalleryProvider>
          </AttachmentPickerProvider>
        </MessageOverlayProvider>
      </OverlayContext.Provider>
    </TranslationProvider>
  );
};
