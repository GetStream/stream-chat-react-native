import type { Attachment } from 'stream-chat';

import { buildGalleryOfSingleImage } from './buildGalleryOfSingleImage';
import { buildGalleryOfThreeImages } from './buildGalleryOfThreeImages';
import { buildGalleryOfTwoImages } from './buildGalleryOfTwoImages';

import { buildThumbnailGrid } from './buildThumbnailGrid';

import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import {
  chatConfigContextDefaultvalue,
  ChatConfigContextValue,
} from '../../../../contexts/chatConfigContext/ChatConfigContext';

/**
 * Builds the gallery layout for image attachments, with a dedicated layout for one, two and three
 * images. Four or more use a 2x2 grid of the first four.
 *
 * @param params.images Image attachments to lay out.
 * @param params.resizableCDNHosts CDN hosts whose image URLs can be resized. Defaults to the chat
 * config default.
 * @param params.sizeConfig Size limits of the gallery.
 * @returns The gallery size, its thumbnails and the `invertedDirections` it was built with.
 */
export function buildGallery({
  images,
  resizableCDNHosts = chatConfigContextDefaultvalue.resizableCDNHosts,
  sizeConfig,
}: Pick<ChatConfigContextValue, 'resizableCDNHosts'> & {
  images: Attachment[];
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  if (images.length === 1) {
    return buildGalleryOfSingleImage({
      image: images[0],
      resizableCDNHosts,
      sizeConfig,
    });
  }

  if (images.length === 2) {
    return buildGalleryOfTwoImages({
      images,
      resizableCDNHosts,
      sizeConfig,
    });
  }

  if (images.length === 3) {
    return buildGalleryOfThreeImages({
      images,
      resizableCDNHosts,
      sizeConfig,
    });
  }

  // Four or more images: a 2x2 grid of the first four.
  return buildThumbnailGrid({
    grid: [
      [1, 1],
      [1, 1],
    ],
    images: images.slice(0, 4),
    invertedDirections: true,
    resizableCDNHosts,
    sizeConfig,
  });
}
