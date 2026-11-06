import { type Attachment, getAttachmentPreviewUrl } from 'stream-chat';

import { getPlayableVideoUrl } from './attachmentUrls';

import { FileTypes } from '../types/types';

/**
 * Returns the URL to display for an image attachment.
 *
 * @param image The image attachment.
 * @param giphyVersion The Giphy rendition used for Giphy attachments. Defaults to 'fixed_height'.
 * @returns The image URL.
 */
export function getUrlOfImageAttachment(
  image: Attachment,
  giphyVersion: keyof NonNullable<Attachment['giphy']> = 'fixed_height',
) {
  if (image.type === FileTypes.Giphy) {
    return image.giphy?.[giphyVersion]?.url || image.thumb_url;
  }

  // Videos open in the player, so resolve the playable file rather than the thumbnail.
  if (image.type === FileTypes.Video) {
    return getPlayableVideoUrl(image);
  }

  return getAttachmentPreviewUrl(image, image.image_url, image.asset_url);
}
