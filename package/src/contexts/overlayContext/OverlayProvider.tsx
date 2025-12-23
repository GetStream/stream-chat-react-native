import React, { PropsWithChildren, useEffect, useState } from 'react';

import { BackHandler, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

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
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PortalHost, PortalProvider } from 'react-native-teleport';

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
        isMyMessage?: boolean;
        rect?: { w: number; h: number; x: number; y: number };
      }
    | undefined;
  topH: Animated.SharedValue<Rect> | undefined;
  bottomH: Animated.SharedValue<Rect> | undefined;
  id: string | undefined;
  closing: boolean;
};

const DefaultState = {
  bottomH: undefined,
  closing: false,
  id: undefined,
  state: undefined,
  topH: undefined,
};

export const openOverlay = (id: string, { state, topH, bottomH }: Partial<OverlayState>) =>
  overlayStore.partialNext({ bottomH, closing: false, id, state, topH });

export const closeOverlay = () => {
  requestAnimationFrame(() => overlayStore.partialNext({ closing: true }));
};

let actionQueue: Array<() => void | Promise<void>> = [];

export const scheduleActionOnClose = (action: () => void | Promise<void>) => {
  const { id } = overlayStore.getLatestValue();
  if (id) {
    actionQueue.push(action);
    return;
  }
  action();
};

const s = (nextState: OverlayState) => ({ active: !!nextState.id });

const finalizeCloseOverlay = () => overlayStore.partialNext(DefaultState);

export const overlayStore = new StateStore<OverlayState>(DefaultState);

overlayStore.subscribeWithSelector(s, async ({ active }) => {
  if (!active) {
    // flush the queue
    for (const action of actionQueue) {
      await action();
    }

    actionQueue = [];
  }
});

const selector = (nextState: OverlayState) => ({
  bottomH: nextState.bottomH,
  closing: nextState.closing,
  id: nextState.id,
  state: nextState.state,
  topH: nextState.topH,
});

export const useOverlayController = () => {
  return useStateStore(overlayStore, selector);
};

const OverlayHostLayer = () => {
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
    if (!rect || !topH?.value || !bottomH?.value) return 0;

    const anchorY = rect.y;
    const msgH = rect.h;

    const minTop = minY + topH.value.h;
    const maxTop = maxY - (msgH + bottomH.value.h);

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
    return {
      height: topH.value.h,
      opacity: 1,
      top: rect.y - topH.value.h,
      width: topH.value.w,
    };
  }, [rect, closing, topH]);

  const topItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;

    return {
      transform: [
        {
          translateY: withTiming(target, { duration: 150 }),
        },
      ],
    };
  });

  const bottomItemStyle = useAnimatedStyle(() => {
    if (!bottomH?.value || !rect || closing) return { height: 0, opacity: 0 };
    console.log('wtf is going on: ', bottomH.value, rect);
    return {
      height: bottomH.value.h,
      opacity: 1,
      top: rect.y + rect.h,
      width: bottomH.value.w,
    };
  }, [rect, closing, bottomH]);

  const bottomItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;

    return {
      transform: [
        {
          translateY: withTiming(target, { duration: 150 }),
        },
      ],
    };
  });

  return (
    <>
      {isActive ? (
        <Animated.View
          pointerEvents='box-none'
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }, backdropStyle]}
        />
      ) : null}

      {isActive && !closing ? (
        <Pressable onPress={closeOverlay} style={StyleSheet.absoluteFillObject} />
      ) : null}

      <Animated.View
        entering={FadeIn.duration(ANIMATED_DURATION).easing(Easing.in(Easing.cubic))}
        exiting={FadeOut.duration(ANIMATED_DURATION).easing(Easing.out(Easing.cubic))}
        style={[
          isActive && rect
            ? {
                position: 'absolute',
                ...(isMyMessage ? { right: rect.x } : { left: rect.x }),
              }
            : null,
          topItemStyle,
          topItemTranslateStyle,
        ]}
      >
        <PortalHost name='top-item' style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <Animated.View
        pointerEvents='box-none'
        style={[
          isActive && rect
            ? {
                height: rect.h,
                position: 'absolute',
                top: rect.y,
                width: rect.w,
                ...(isMyMessage ? { right: rect.x } : { left: rect.x }),
              }
            : null,
          hostStyle,
        ]}
      >
        <PortalHost name='message-overlay' style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <Animated.View
        entering={FadeIn.duration(ANIMATED_DURATION).easing(Easing.in(Easing.cubic))}
        exiting={FadeOut.duration(ANIMATED_DURATION).easing(Easing.out(Easing.cubic))}
        style={[
          isActive && rect
            ? {
                position: 'absolute',
                ...(isMyMessage ? { right: rect.x } : { left: rect.x }),
              }
            : null,
          bottomItemStyle,
          bottomItemTranslateStyle,
        ]}
      >
        <PortalHost name='bottom-item' style={StyleSheet.absoluteFillObject} />
      </Animated.View>
    </>
  );
};

type Rect = { x: number; y: number; w: number; h: number } | undefined;

const ANIMATED_DURATION = 150;
