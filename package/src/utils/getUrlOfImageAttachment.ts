import type { Attachment } from 'stream-chat';

import { FileTypes } from '../types/types';

/**
 * Extract url of image from image attachment.
 * @param image Image attachment
 * @returns {string}
 */
export function getUrlOfImageAttachment(
  image: Attachment,
  giphyVersion: keyof NonNullable<Attachment['giphy']> = 'fixed_height',
) {
  if (image.type === FileTypes.Giphy) {
    return image.giphy?.[giphyVersion]?.url || image.thumb_url;
  }

  return image.image_url || image.asset_url;
}
