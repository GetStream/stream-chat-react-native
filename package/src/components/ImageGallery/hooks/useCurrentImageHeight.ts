import { useEffect } from 'react';
import { Image } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

import type {
  ImageGalleryAsset,
  ImageGalleryStateStore,
} from '../../../state-store/image-gallery-state-store';
import { FileTypes } from '../../../types/types';

/**
 * Owns a SharedValue tracking the visible height of the currently selected
 * gallery asset and keeps it in lockstep with the gallery store's
 * currentIndex. Worklet consumers read `.value` on the UI thread.
 *
 * The store is subscribed via `subscribeWithSelector` (not `useStateStore`),
 * so currentIndex changes never go through React state so no rerender is
 * triggered in the calling component. The callback writes directly into the
 * SharedValue.
 *
 * Sync path uses the attachment's intrinsic `original_height`/`original_width`
 * when present. Async fallback via `Image.getSize` handles assets that don't
 * carry dimensions; a token guards against the closure-race where the user
 * swipes past a slide before its dimensions resolve.
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
        Image.getSize(photo.uri, (width, height) => {
          // Stale result, currentIndex moved on before getSize resolved.
          if (currentToken !== latestToken) return;
          const imageHeight = Math.floor(height * (fullWindowWidth / width));
          currentImageHeight.value =
            imageHeight > fullWindowHeight ? fullWindowHeight : imageHeight;
        });
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
