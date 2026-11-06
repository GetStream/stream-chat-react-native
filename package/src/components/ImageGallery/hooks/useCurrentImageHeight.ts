import { useEffect } from 'react';
import { Image } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

import type {
  ImageGalleryAsset,
  ImageGalleryStateStore,
} from '../../../state-store/image-gallery-state-store';
import { FileTypes } from '../../../types/types';

/**
 * A SharedValue with the visible height of the currently selected asset, kept in sync with the
 * gallery store's `currentIndex`. Worklets read `.value` on the UI thread.
 *
 * The store is subscribed with `subscribeWithSelector`, not `useStateStore`, so an index change
 * writes the SharedValue without re-rendering the caller.
 *
 * The height comes from `original_height` and `original_width` when present, otherwise from
 * `Image.getSize`, whose result is discarded when the user has already swiped to another slide.
 */
export const useCurrentImageHeight = ({
  assets,
  fullWindowHeight,
  fullWindowWidth,
  imageGalleryStateStore,
}: {
  assets: ImageGalleryAsset[];
  fullWindowHeight: number;
  fullWindowWidth: number;
  imageGalleryStateStore: ImageGalleryStateStore;
}): SharedValue<number> => {
  const currentImageHeight = useSharedValue(fullWindowHeight);

  useEffect(() => {
    let latestToken = 0;

    const compute = (index: number) => {
      const currentToken = ++latestToken;
      const photo = assets[index];

      if (photo?.original_height && photo?.original_width) {
        const h = Math.floor(photo.original_height * (fullWindowWidth / photo.original_width));
        currentImageHeight.value = h > fullWindowHeight ? fullWindowHeight : h;
        return;
      }

      if (photo?.uri && photo.type === FileTypes.Image) {
        Image.getSize(
          photo.uri,
          (width, height) => {
            // Stale result: `currentIndex` moved on before `getSize` resolved.
            if (currentToken !== latestToken) return;
            if (!width || !height) {
              currentImageHeight.value = fullWindowHeight;
              return;
            }
            const imageHeight = Math.floor(height * (fullWindowWidth / width));
            currentImageHeight.value =
              imageHeight > fullWindowHeight ? fullWindowHeight : imageHeight;
          },
          () => {
            if (currentToken !== latestToken) return;
            currentImageHeight.value = fullWindowHeight;
          },
        );
        return;
      }

      currentImageHeight.value = fullWindowHeight;
    };

    compute(imageGalleryStateStore.state.getLatestValue().currentIndex);

    return imageGalleryStateStore.state.subscribeWithSelector(
      (state) => ({ currentIndex: state.currentIndex }),
      ({ currentIndex }) => compute(currentIndex),
    );
  }, [assets, fullWindowHeight, fullWindowWidth, currentImageHeight, imageGalleryStateStore]);

  return currentImageHeight;
};
