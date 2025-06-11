import React, { PropsWithChildren, useEffect, useState } from 'react';

import { BackHandler } from 'react-native';

import { cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';

import { OverlayContext, OverlayProviderProps } from './OverlayContext';

import { ImageGallery } from '../../components/ImageGallery/ImageGallery';

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
          </ThemeProvider>
        </ImageGalleryProvider>
      </OverlayContext.Provider>
    </TranslationProvider>
  );
};
