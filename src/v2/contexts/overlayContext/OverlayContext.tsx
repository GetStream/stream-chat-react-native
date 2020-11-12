import React, {
  PropsWithChildren,
  useContext,
  useEffect,
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
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { ImageGalleryProvider } from '../imageGalleryContext/ImageGalleryContext';
import { MessageOverlayProvider } from '../messageOverlayContext/MessageOverlayContext';
import { DeepPartial, ThemeProvider } from '../themeContext/ThemeContext';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../translationContext/TranslationContext';
import { getDisplayName } from '../utils/getDisplayName';

import {
  ImageGallery,
  ImageGalleryCustomComponents,
} from '../../components/ImageGallery/ImageGallery';
import { MessageOverlay } from '../../components/MessageOverlay/MessageOverlay';
import { BlurView } from '../../native';
import { useStreami18n } from '../../utils/useStreami18n';

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

export type BlurType = 'light' | 'dark' | undefined;

export type Overlay = 'none' | 'gallery' | 'message';

export type OverlayContextValue = {
  overlay: Overlay;
  setBlurType: React.Dispatch<React.SetStateAction<BlurType>>;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
  style?: DeepPartial<Theme>;
};

export const OverlayContext = React.createContext<OverlayContextValue>(
  {} as OverlayContextValue,
);

type Props<Us extends UnknownType = DefaultUserType> = PropsWithChildren<
  ImageGalleryCustomComponents<Us> & {
    i18nInstance?: Streami18n;
    value?: Partial<OverlayContextValue>;
  }
>;

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
  const { children, i18nInstance, imageGalleryCustomComponents, value } = props;

  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: (input?: string | number | Date) => Dayjs(input),
  });
  const [overlay, setOverlay] = useState(value?.overlay || 'none');
  const [blurType, setBlurType] = useState<BlurType>();
  const { height, width } = useWindowDimensions();
  const overlayOpacity = useSharedValue(1);

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

  // Setup translators
  useStreami18n({ i18nInstance, setTranslators });

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
    style: value?.style,
  };

  return (
    <TranslationProvider value={translators}>
      <OverlayContext.Provider value={overlayContext}>
        <MessageOverlayProvider<At, Ch, Co, Ev, Me, Re, Us>>
          <ImageGalleryProvider>
            {children}
            <ThemeProvider style={overlayContext.style}>
              {overlay !== 'none' && (
                <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
                  <BlurView
                    blurType={blurType}
                    style={[StyleSheet.absoluteFill, { height, width }]}
                  />
                </Animated.View>
              )}
              <MessageOverlay />
              <ImageGallery<At, Ch, Co, Ev, Me, Re, Us>
                imageGalleryCustomComponents={imageGalleryCustomComponents}
                overlayOpacity={overlayOpacity}
                visible={overlay === 'gallery'}
              />
            </ThemeProvider>
          </ImageGalleryProvider>
        </MessageOverlayProvider>
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
