import type { Attachment } from 'stream-chat';

/**
 * Extract url of image from image attachment.
 * @param image Image attachment
 * @returns {string}
 */
export function getUrlOfImageAttachment(image: Attachment) {
  return image.image_url || image.thumb_url || image.asset_url;
}
