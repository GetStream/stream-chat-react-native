import { type Attachment, getAttachmentPreviewUrl } from 'stream-chat';

import { getAttachmentUrl } from './attachmentUrls';

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

  // A video's URL is what the full-screen gallery plays and what a tap selects, so it must be the
  // video itself. Its `previewUri` is the thumbnail (`setupVideoAttachmentPreviewMiddleware`), which
  // the preview fallback below would return for a video still uploading.
  if (image.type === FileTypes.Video) {
    return getAttachmentUrl(image);
  }

  // The preview fallback is what keeps a still-uploading image visible: it has no `image_url` until
  // the upload resolves. This is the choke point for the gallery, the image-gallery store and the
  // channel-details media list alike.
  return getAttachmentPreviewUrl(image, image.image_url, image.asset_url);
}
