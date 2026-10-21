import type { Attachment } from 'stream-chat';

import { buildThumbnailGrid } from './buildThumbnailGrid';

import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import { ChatConfigContextValue } from '../../../../contexts/chatConfigContext/ChatConfigContext';

import { getAspectRatio } from '../getAspectRatio';

/** Returns a copy of `array` with `item` first, or `array` itself when `item` is absent. */
function moveToFront<T>(array: T[], item: T): T[] {
  const index = array.indexOf(item);
  if (index === -1) {
    return array;
  }
  const newArray = [...array];
  newArray.splice(index, 1);
  newArray.unshift(item);
  return newArray;
}

export function buildGalleryOfThreeImages({
  images,
  resizableCDNHosts,
  sizeConfig,
}: Pick<ChatConfigContextValue, 'resizableCDNHosts'> & {
  images: Attachment[];
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  // Finds the most landscape and the most portrait image.
  const { landscapeImage, landscapeImageAspectRatio, portraitImage, portraitImageAspectRatio } =
    images.reduce(
      (acc, image) => {
        const aspectRatio = getAspectRatio(image);
        const o = { ...acc };

        if (aspectRatio > 1) {
          if (!o.landscapeImage || aspectRatio > o.landscapeImageAspectRatio) {
            o.landscapeImage = image;
            o.landscapeImageAspectRatio = aspectRatio;
          }
        } else {
          if (!o.portraitImage || aspectRatio < o.portraitImageAspectRatio) {
            o.portraitImage = image;
            o.portraitImageAspectRatio = aspectRatio;
          }
        }

        return o;
      },
      {
        landscapeImageAspectRatio: 1,
        portraitImageAspectRatio: 1,
      } as {
        landscapeImage: Attachment;
        landscapeImageAspectRatio: number;
        portraitImage: Attachment;
        portraitImageAspectRatio: number;
      },
    );

  // The more extreme of the two images, by aspect ratio, leads the layout.
  if (landscapeImageAspectRatio > 1 / portraitImageAspectRatio) {
    // The landscape image on top, the other two side by side below.
    return buildThumbnailGrid({
      grid: [[1], [1, 1]],
      images: landscapeImage ? moveToFront(images, landscapeImage) : images,
      invertedDirections: true,
      resizableCDNHosts,
      sizeConfig,
    });
  } else {
    // The portrait image on the left, the other two stacked on the right.
    return buildThumbnailGrid({
      grid: [[1], [1, 1]],
      images: portraitImage ? moveToFront(images, portraitImage) : images,
      invertedDirections: false,
      resizableCDNHosts,
      sizeConfig,
    });
  }
}
