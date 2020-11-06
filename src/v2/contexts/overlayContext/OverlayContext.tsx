import React, { PropsWithChildren, useContext, useState } from 'react';
import { StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { MessageOverlayProvider } from '../messageOverlayContext/MessageOverlayContext';
import { DeepPartial, ThemeProvider } from '../themeContext/ThemeContext';
import { getDisplayName } from '../utils/getDisplayName';

import { MessageOverlay } from '../../components/MessageOverlay/MessageOverlay';
import { BlurView } from '../../native';

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

export type Overlay = 'none' | 'gallery' | 'message';

export type OverlayContextValue = {
  overlay: Overlay;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
  style?: DeepPartial<Theme>;
};

export const OverlayContext = React.createContext<OverlayContextValue>(
  {} as OverlayContextValue,
);

export const OverlayProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<OverlayContextValue> }>) => {
  const [overlay, setOverlay] = useState(value?.overlay || 'none');
  const { height, width } = useWindowDimensions();
  const overlayOpacity = useSharedValue(1);
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
  };

  return (
    <OverlayContext.Provider value={overlayContext}>
      <MessageOverlayProvider<At, Ch, Co, Ev, Me, Re, Us>>
        {children}
        <ThemeProvider style={overlayContext.style}>
          {overlay !== 'none' && (
            <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
              <BlurView style={[StyleSheet.absoluteFill, { height, width }]} />
            </Animated.View>
          )}
          <MessageOverlay />
        </ThemeProvider>
      </MessageOverlayProvider>
    </OverlayContext.Provider>
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
