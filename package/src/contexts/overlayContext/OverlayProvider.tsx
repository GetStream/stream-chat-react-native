import React, { PropsWithChildren, useEffect, useState } from 'react';

import {
  BackHandler,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  clamp,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal, PortalHost, PortalProvider } from 'react-native-teleport';

import { StateStore } from 'stream-chat';

import { OverlayContext, OverlayProviderProps } from './OverlayContext';

import { ImageGallery } from '../../components/ImageGallery/ImageGallery';

import { useStateStore } from '../../hooks';
import { useStreami18n } from '../../hooks/useStreami18n';

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
  const {
    autoPlayVideo,
    children,
    giphyVersion,
    i18nInstance,
    imageGalleryCustomComponents,
    imageGalleryGridHandleHeight = 40,
    imageGalleryGridSnapPoints,
    numberOfImageGalleryGridColumns,
    value,
  } = props;

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

  useEffect(() => {
    cancelAnimation(overlayOpacity);
    if (overlay !== 'none') {
      overlayOpacity.value = withTiming(1);
    } else {
      overlayOpacity.value = withTiming(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  const overlayContext = {
    overlay,
    setOverlay,
    style: value?.style,
  };

  return (
    <TranslationProvider value={{ ...translators, userLanguage: DEFAULT_USER_LANGUAGE }}>
      <OverlayContext.Provider value={overlayContext}>
        <ImageGalleryProvider>
          <ThemeProvider style={overlayContext.style}>
            <PortalProvider>
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
              <OverlayHostLayer />
            </PortalProvider>
          </ThemeProvider>
        </ImageGalleryProvider>
      </OverlayContext.Provider>
    </TranslationProvider>
  );
};

type OverlayState = {
  state:
    | {
        isMyMessage: boolean;
        rect: { w: number; h: number; x: number; y: number };
      }
    | undefined;
  topH: Animated.SharedValue<Rect> | undefined;
  bottomH: Animated.SharedValue<Rect> | undefined;
  id: string | undefined;
  closing: boolean;
};

const DefaultState = {
  state: undefined,
  topH: undefined,
  bottomH: undefined,
  id: undefined,
  closing: false,
};

export const openOverlay = (id, { state, topH, bottomH }: Partial<OverlayState>) =>
  overlayStore.partialNext({ state, topH, bottomH, id, closing: false });

export const closeOverlay = () => {
  console.log('CLOSING INVOKED?!r');
  requestAnimationFrame(() => overlayStore.partialNext({ closing: true }));
};

const finalizeCloseOverlay = () => overlayStore.partialNext(DefaultState);

export const overlayStore = new StateStore<OverlayState>(DefaultState);

const selector = (nextState: OverlayState) => ({
  state: nextState.state,
  topH: nextState.topH,
  bottomH: nextState.bottomH,
  id: nextState.id,
  closing: nextState.closing,
});

export const useOverlayController = () => {
  return useStateStore(overlayStore, selector);
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function OverlayHostLayer() {
  const { state, topH, bottomH, id, closing } = useOverlayController();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const isActive = !!id;

  const { rect, isMyMessage } = state ?? {};

  const padding = 8;
  const minY = insets.top + padding;
  const maxY = screenH - insets.bottom - padding;

  const backdrop = useSharedValue(0);

  useAnimatedReaction(
    () => (isActive && !closing ? 1 : 0),
    (next, prev) => {
      if (next === prev) return;

      cancelAnimation(backdrop);
      backdrop.value = withTiming(next, {
        duration: next === 1 ? 160 : 140,
      });
    },
    [isActive, closing],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const shiftY = useDerivedValue(() => {
    if (!rect || !topH?.value) return 0;

    const anchorY = rect.y;
    const msgH = rect.h;

    const minTop = minY + topH.value.h;
    const maxTop = maxY - (msgH + bottomH.value.h);

    // you said: assume it can fit
    const solvedTop = clamp(anchorY, minTop, maxTop);
    return solvedTop - anchorY;
  });

  const hostStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;

    return {
      transform: [
        {
          translateY: withTiming(target, { duration: 150 }, (finished) => {
            if (finished && closing) {
              runOnJS(finalizeCloseOverlay)();
            }
          }),
        },
      ],
    };
  }, [isActive, closing]);
  const topItemStyle = useAnimatedStyle(() => {
    if (!topH?.value || !rect || closing) return { height: 0, opacity: 0 };
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;
    console.log('TESTH: ', topH.value);
    return {
      top: rect.y - topH.value.h + target,
      width: topH.value.w,
      height: topH.value.h,
      opacity: 1,
      // transform: [
      //   {
      //     translateY: withTiming(target, { duration: 150 }),
      //   },
      // ],
    };
  }, [rect, closing, topH]);

  console.log('SHIFTVAL: ', isActive, shiftY.value, rect, isMyMessage);

  return (
    <>
      {isActive ? (
        <Animated.View
          pointerEvents='box-none'
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }, backdropStyle]}
        />
      ) : null}
      {/*{isActive && !closing ? (*/}
      {/*  <TouchableWithoutFeedback*/}
      {/*    onPress={closeOverlay}*/}
      {/*    // pointerEvents='box-none'*/}
      {/*  >*/}
      {/*    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'green' }]} />*/}
      {/*  </TouchableWithoutFeedback>*/}
      {/*) : null}*/}
      {/*<View pointerEvents='box-none' style={StyleSheet.absoluteFill}>*/}
      {/*  /!* 1) BACKDROP: full-screen, captures outside taps, blocks underlying app *!/*/}
      {/*  {isActive && !closing ? (*/}
      {/*    <AnimatedPressable*/}
      {/*      onPress={closeOverlay}*/}
      {/*      pointerEvents='auto'*/}
      {/*      style={[*/}
      {/*        StyleSheet.absoluteFillObject,*/}
      {/*        { backgroundColor: '#000000CC', zIndex: 0, elevation: 0 },*/}
      {/*        backdropStyle,*/}
      {/*      ]}*/}
      {/*    />*/}
      {/*  ) : null}*/}
      {/*</View>*/}
      {isActive && !closing ? (
        // <View style={{ flex: 1 }}>
        //   <View style={{ flex: 1 }}>
        <Pressable
          onPress={closeOverlay}
          // pointerEvents='box-none'
          style={[StyleSheet.absoluteFillObject]}
        />
      ) : //   </View>
      // </View>
      null}
      {/*<Portal hostName={isActive && !closing ? 'backdrop' : undefined} name='backdrop'>*/}
      {/*  <TouchableWithoutFeedback*/}
      {/*    onPress={closeOverlay}*/}
      {/*    // pointerEvents='box-none'*/}
      {/*    style={[StyleSheet.absoluteFillObject, { backgroundColor: 'green' }]}*/}
      {/*  />*/}
      {/*</Portal>*/}
      {/*<View*/}
      {/*  pointerEvents='box-none'*/}
      {/*  style={[StyleSheet.absoluteFillObject, { zIndex: 0, elevation: 0 }]}*/}
      {/*>*/}
      {/*  <PortalHost name='backdrop' style={StyleSheet.absoluteFillObject} />*/}
      {/*</View>*/}
      {/*{isActive && !closing ? (*/}
      {/*  <Portal name='backdrop'>*/}
      {/*<Pressable*/}
      {/*  onPress={closeOverlay}*/}
      {/*  // pointerEvents='box-none'*/}
      {/*  style={[StyleSheet.absoluteFillObject, { backgroundColor: 'green' }]}*/}
      {/*/>*/}
      {/*  </Portal>*/}
      {/*) : null}*/}
      {/*{isActive && !closing && rect ? (*/}
      {/*  <OutsideTapCatcher bounds={{ left: rect.x, right: rect.x + rect.w, top: rect.y, bottom: rect.y + rect.h }} enabled={isActive && !closing} onOutsideTap={closeOverlay} />*/}
      {/*) : null}*/}
      <Animated.View
        entering={FadeIn.duration(ANIMATED_DURATION).easing(Easing.in(Easing.cubic))}
        exiting={FadeOut.duration(ANIMATED_DURATION).easing(Easing.out(Easing.cubic))}
        style={[
          isActive
            ? {
                position: 'absolute',
                ...(isMyMessage ? { right: rect.x } : { left: rect.x }),
              }
            : null,
          topItemStyle,
          // hostStyle,
        ]}
      >
        <PortalHost name='top-item' style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <Animated.View
        pointerEvents='box-none'
        style={[
          isActive
            ? {
                position: 'absolute',
                top: rect.y,
                width: rect.w,
                height: rect.h,
                ...(isMyMessage ? { right: rect.x } : { left: rect.x }),
              }
            : null,
          hostStyle,
        ]}
      >
        <PortalHost name='message-overlay' style={StyleSheet.absoluteFillObject} />
      </Animated.View>
    </>
  );
}

type Rect = { x: number; y: number; w: number; h: number };

export function OutsideTapRectDetector({
  enabled,
  rect,
  onOutsideTap,
  children,
}: {
  enabled: boolean;
  rect: Rect;
  onOutsideTap: () => void;
  children: React.ReactNode;
}) {
  const nativeTap = Gesture.Native();
  const gesture = React.useMemo(() => {
    return Gesture.Tap()
      .enabled(enabled)
      .maxDistance(12)
      .requireExternalGestureToFail(nativeTap)
      .onEnd((_e, success) => {
        if (success) runOnJS(onOutsideTap)();
      });
  }, [nativeTap, enabled, onOutsideTap]);

  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}

const ANIMATED_DURATION = 150;
