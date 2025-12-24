import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { BackHandler, Dimensions, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  clamp,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
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

const { height: SCREEN_H } = Dimensions.get('screen');

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
  const { height: screenH, width: screenW } = useWindowDimensions();

  const isActive = !!id;

  const { rect, isMyMessage } = state ?? {};

  const padding = 8;
  const minY = insets.top + padding;
  const maxY = screenH - insets.bottom - padding;

  const backdrop = useSharedValue(0);

  useEffect(() => {
    const target = isActive && !closing ? 1 : 0;
    cancelAnimation(backdrop);
    backdrop.value = withTiming(target, {
      duration: target === 1 ? 160 : 140,
    });
  }, [isActive, closing, backdrop]);

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
  }, [rect]);

  const topItemLayout = useDerivedValue(() => {
    if (!topH?.value || !rect || closing) return undefined;

    return {
      h: topH.value.h,
      w: topH.value.w,
      x: isMyMessage ? screenW - rect.x - topH.value.w : rect.x,
      y: rect.y - topH.value.h,
    };
  }, [rect, isMyMessage, closing]);

  const topItemStyle = useAnimatedStyle(() => {
    if (!topItemLayout.value) return { height: 0 };
    return {
      height: topItemLayout.value.h,
      left: topItemLayout.value.x,
      top: topItemLayout.value.y,
      width: topItemLayout.value.w,
    };
  }, []);

  const topItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;

    return {
      transform: [
        {
          translateY: withTiming(target, { duration: 150 }),
        },
        {
          scale: backdrop.value,
        },
      ],
    };
  }, [isActive, closing]);

  const bottomItemLayout = useDerivedValue(() => {
    if (!bottomH?.value || !rect || closing) return undefined;

    return {
      h: bottomH.value.h,
      w: bottomH.value.w,
      x: isMyMessage ? screenW - rect.x - bottomH.value.w : rect.x,
      y: rect.y + rect.h,
    };
  }, [rect, isMyMessage, closing]);

  const bottomItemStyle = useAnimatedStyle(() => {
    if (!bottomItemLayout.value) return { height: 0 };
    return {
      height: bottomItemLayout.value.h,
      left: bottomItemLayout.value.x,
      top: bottomItemLayout.value.y,
      width: bottomItemLayout.value.w,
    };
  }, []);

  const bottomItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;

    return {
      transform: [
        {
          translateY: withTiming(target, { duration: 150 }),
        },
        {
          scale: backdrop.value,
        },
      ],
    };
  }, [isActive, closing]);

  const viewportH = useSharedValue(SCREEN_H);

  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scrollY.value = 0;
    }
  }, [isActive, scrollY]);

  const hostStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? -scrollY.value : shiftY.value) : 0;

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

  const contentH = useDerivedValue(
    () =>
      topH?.value && bottomH?.value && rect
        ? Math.max(
            screenH,
            topH.value.h + rect.h + bottomH.value.h + insets.top + insets.bottom + 20,
          )
        : 0,
    [rect],
  );
  const maxScroll = useDerivedValue(() => Math.max(0, contentH.value - viewportH.value));
  const initialScrollOffset = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          cancelAnimation(scrollY);
          initialScrollOffset.value = scrollY.value;
        })
        .onUpdate((e) => {
          scrollY.value = clamp(initialScrollOffset.value + e.translationY, 0, maxScroll.value);
        })
        .onEnd((e) => {
          scrollY.value = withDecay({ clamp: [0, maxScroll.value], velocity: e.velocityY });
        }),
    [initialScrollOffset, maxScroll, scrollY],
  );

  const blockedRect = useSharedValue<{ x: number; y: number; w: number; h: number } | undefined>(
    undefined,
  );

  useEffect(() => {
    blockedRect.value = rect;
  }, [rect, blockedRect]);

  const tap = Gesture.Tap()
    .onTouchesDown((e, state) => {
      const t = e.allTouches[0];
      if (!t) return;

      const x = t.x;
      const y = t.y;

      const rects = [bottomItemLayout, topItemLayout];
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i].value;
        if (
          !r ||
          (x >= r.x && x <= r.x + r.w && y >= r.y + shiftY.value && y <= r.y + r.h + shiftY.value)
        ) {
          state.fail();
          return;
        }
      }
    })
    .onEnd(() => {
      runOnJS(closeOverlay)();
    });

  const contentStyle = useAnimatedStyle(() => ({
    height: contentH.value,
    transform: [{ translateY: scrollY.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
        {isActive ? (
          <Animated.View
            pointerEvents='box-none'
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }, backdropStyle]}
          />
        ) : null}

        <Animated.View style={[contentStyle]}>
          <Animated.View
            style={[
              isActive && rect
                ? {
                    position: 'absolute',
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
        </Animated.View>
      </View>
    </GestureDetector>
  );
};
type Rect = { x: number; y: number; w: number; h: number } | undefined;
