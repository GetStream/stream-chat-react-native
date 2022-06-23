import type { Attachment } from 'stream-chat';

/**
 * Extract url of image from image attachment.
 * @param image Image attachment
 * @returns {string}
 */
export function getUrlOfImageAttachment(image: Attachment) {
  return image.thumb_url || image.image_url || image.asset_url;
}
