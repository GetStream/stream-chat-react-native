import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

import { cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';

import {
  ImageGalleryProvider,
  useImageGalleryContext,
} from '../../../../contexts/imageGalleryContext/ImageGalleryContext';
import { type Overlay, OverlayContext } from '../../../../contexts/overlayContext/OverlayContext';
import { ImageGallery } from '../../../ImageGallery/ImageGallery';

/**
 * Scopes the image gallery overlay to the ChannelDetails modal.
 *
 * The SDK's root `OverlayProvider` renders `<ImageGallery>` in the main app tree, which paints
 * *behind* the native `<Modal>` the ChannelDetails screens live in. This provider re-hosts a
 * modal-local overlay so the gallery is visible above the modal.
 *
 * It intentionally provides ONLY the overlay + image gallery contexts (and renders the gallery),
 * unlike the root `OverlayProvider` which also re-creates Translation/Theme/Accessibility
 * providers. Those flow down from the root through the native modal, so the gallery keeps the
 * app's configured language/theme — re-creating them here would reset translations to English
 * defaults (`OverlayProvider` builds a fresh `Streami18n` when no `i18nInstance` is passed, and
 * the instance is not exposed via context to forward).
 *
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsOverlayProvider = ({ children }: PropsWithChildren) => {
  // Reads the ROOT image gallery context (this runs above the nested provider below). We forward
  // every config prop except the store itself, so any prop added to `ImageGalleryProviderProps`
  // in the future is inherited by the modal-local gallery automatically — no change needed here.
  const rootImageGalleryContext = useImageGalleryContext();

  const [overlay, setOverlay] = useState<Overlay>('none');
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(overlayOpacity);
    overlayOpacity.value = withTiming(overlay !== 'none' ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  // Hardware back closes the gallery before the modal.
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (overlay !== 'none') {
        setOverlay('none');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [overlay]);

  const overlayContextValue = useMemo(
    () => ({ overlay, overlayOpacity, setOverlay }),
    [overlay, overlayOpacity],
  );

  const imageGalleryProviderProps = useMemo(() => {
    // Drop only the store; forward all other (current and future) config props verbatim.
    const { imageGalleryStateStore: _rootStore, ...config } = rootImageGalleryContext;
    return config;
  }, [rootImageGalleryContext]);

  return (
    <OverlayContext.Provider value={overlayContextValue}>
      <ImageGalleryProvider value={imageGalleryProviderProps}>
        {children}
        {overlay === 'gallery' ? <ImageGallery overlayOpacity={overlayOpacity} /> : null}
      </ImageGalleryProvider>
    </OverlayContext.Provider>
  );
};
