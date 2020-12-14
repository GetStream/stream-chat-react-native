import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import Dayjs from 'dayjs';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  AttachmentPickerContextValue,
  AttachmentPickerProvider,
} from '../attachmentPickerContext/AttachmentPickerContext';
import { ChannelInfoOverlayProvider } from '../channelInfoOverlayContext/ChannelInfoOverlayContext';
import { ImageGalleryProvider } from '../imageGalleryContext/ImageGalleryContext';
import { MessageOverlayProvider } from '../messageOverlayContext/MessageOverlayContext';
import { DeepPartial, ThemeProvider } from '../themeContext/ThemeContext';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../translationContext/TranslationContext';
import { getDisplayName } from '../utils/getDisplayName';

import {
  AttachmentPicker,
  AttachmentPickerProps,
} from '../../components/AttachmentPicker/AttachmentPicker';
import { AttachmentPickerError as DefaultAttachmentPickerError } from '../../components/AttachmentPicker/components/AttachmentPickerError';
import { AttachmentPickerBottomSheetHandle as DefaultAttachmentPickerBottomSheetHandle } from '../../components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle';
import { AttachmentPickerErrorImage as DefaultAttachmentPickerErrorImage } from '../../components/AttachmentPicker/components/AttachmentPickerErrorImage';
import { CameraSelectorIcon as DefaultCameraSelectorIcon } from '../../components/AttachmentPicker/components/CameraSelectorIcon';
import { FileSelectorIcon as DefaultFileSelectorIcon } from '../../components/AttachmentPicker/components/FileSelectorIcon';
import { ImageOverlaySelectedComponent as DefaultImageOverlaySelectedComponent } from '../../components/AttachmentPicker/components/ImageOverlaySelectedComponent';
import { ImageSelectorIcon as DefaultImageSelectorIcon } from '../../components/AttachmentPicker/components/ImageSelectorIcon';
import { ChannelInfoOverlay } from '../../components/ChannelInfoOverlay/ChannelInfoOverlay';
import {
  ImageGallery,
  ImageGalleryCustomComponents,
} from '../../components/ImageGallery/ImageGallery';
import { MessageOverlay } from '../../components/MessageOverlay/MessageOverlay';
import { BlurView } from '../../native';
import { useStreami18n } from '../../utils/useStreami18n';

import type BottomSheet from '@gorhom/bottom-sheet';

import type { Theme } from '../themeContext/utils/theme';

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
import type { Streami18n } from '../../utils/Streami18n';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

export type BlurType = 'light' | 'dark' | undefined;

export type Overlay =
  | 'channelInfo'
  | 'gallery'
  | 'message'
  | 'none'
  | 'wildcard';

export type OverlayContextValue = {
  overlay: Overlay;
  setBlurType: React.Dispatch<React.SetStateAction<BlurType>>;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
  setWildcard: React.Dispatch<
    React.SetStateAction<
      React.ComponentType<{
        visible: boolean;
      }>
    >
  >;
  style?: DeepPartial<Theme>;
  Wildcard?: React.ComponentType<{ visible: boolean }>;
};

export const OverlayContext = React.createContext<OverlayContextValue>(
  {} as OverlayContextValue,
);

type Props<Us extends UnknownType = DefaultUserType> = PropsWithChildren<
  Partial<AttachmentPickerProps> &
    Partial<
      Pick<
        AttachmentPickerContextValue,
        | 'attachmentPickerBottomSheetHeight'
        | 'attachmentSelectionBarHeight'
        | 'bottomInset'
        | 'CameraSelectorIcon'
        | 'FileSelectorIcon'
        | 'ImageSelectorIcon'
      >
    > &
    ImageGalleryCustomComponents<Us> & {
      closePicker?: (ref: React.RefObject<BottomSheetMethods>) => void;
      i18nInstance?: Streami18n;
      openPicker?: (ref: React.RefObject<BottomSheetMethods>) => void;
      value?: Partial<OverlayContextValue>;
    }
>;

const WildcardDefault: React.FC<{ visible: boolean }> = () => null;

export const OverlayProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: Props<Us>,
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
    closePicker = (ref) => ref.current?.close(),
    FileSelectorIcon = DefaultFileSelectorIcon,
    i18nInstance,
    imageGalleryCustomComponents,
    ImageOverlaySelectedComponent = DefaultImageOverlaySelectedComponent,
    ImageSelectorIcon = DefaultImageSelectorIcon,
    numberOfAttachmentImagesToLoadPerCall,
    numberOfAttachmentPickerImageColumns,
    openPicker = (ref) => ref.current?.snapTo(0),
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
  };

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: (input?: string | number | Date) => Dayjs(input),
  });
  const [blurType, setBlurType] = useState<BlurType>();
  const [overlay, setOverlay] = useState(value?.overlay || 'none');
  const [Wildcard, setWildcard] = useState<
    React.ComponentType<{ visible: boolean }>
  >(value?.Wildcard || WildcardDefault);

  const overlayOpacity = useSharedValue(0);
  const { height, width } = useWindowDimensions();

  // Setup translators
  const loadingTranslators = useStreami18n({ i18nInstance, setTranslators });

  useEffect(() => {
    const backAction = () => {
      if (overlay !== 'none') {
        setBlurType(undefined);
        setOverlay('none');
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [overlay]);

  useEffect(() => {
    bottomSheetRef.current?.close();
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
  };

  const overlayStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: overlayOpacity.value,
    }),
    [],
  );

  const overlayContext = {
    overlay,
    setBlurType,
    setOverlay,
    setWildcard,
    style: value?.style,
    Wildcard,
  };

  if (loadingTranslators) return null;

  return (
    <TranslationProvider value={translators}>
      <OverlayContext.Provider value={overlayContext}>
        <ChannelInfoOverlayProvider<At, Ch, Co, Ev, Me, Re, Us>>
          <MessageOverlayProvider<At, Ch, Co, Ev, Me, Re, Us>>
            <AttachmentPickerProvider value={attachmentPickerContext}>
              <ImageGalleryProvider>
                {children}
                <ThemeProvider style={overlayContext.style}>
                  <Animated.View
                    pointerEvents={overlay === 'none' ? 'none' : 'auto'}
                    style={[StyleSheet.absoluteFill, overlayStyle]}
                  >
                    <BlurView
                      blurType={blurType}
                      style={[StyleSheet.absoluteFill, { height, width }]}
                    />
                  </Animated.View>
                  {Wildcard && <Wildcard visible={overlay === 'wildcard'} />}
                  <ChannelInfoOverlay<At, Ch, Co, Ev, Me, Re, Us>
                    overlayOpacity={overlayOpacity}
                    visible={overlay === 'channelInfo'}
                  />
                  <MessageOverlay<At, Ch, Co, Ev, Me, Re, Us>
                    overlayOpacity={overlayOpacity}
                    visible={overlay === 'message'}
                  />
                  <ImageGallery<At, Ch, Co, Ev, Me, Re, Us>
                    imageGalleryCustomComponents={imageGalleryCustomComponents}
                    overlayOpacity={overlayOpacity}
                    visible={overlay === 'gallery'}
                  />
                  <AttachmentPicker
                    ref={bottomSheetRef}
                    {...attachmentPickerProps}
                  />
                </ThemeProvider>
              </ImageGalleryProvider>
            </AttachmentPickerProvider>
          </MessageOverlayProvider>
        </ChannelInfoOverlayProvider>
      </OverlayContext.Provider>
    </TranslationProvider>
  );
};

export const useOverlayContext = () => useContext(OverlayContext);

export const withOverlayContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof OverlayContextValue>> => {
  const WithOverlayContextComponent = (
    props: Omit<P, keyof OverlayContextValue>,
  ) => {
    const overlayContext = useOverlayContext();

    return <Component {...(props as P)} {...overlayContext} />;
  };
  WithOverlayContextComponent.displayName = `WithOverlayContext${getDisplayName(
    Component,
  )}`;
  return WithOverlayContextComponent;
};
