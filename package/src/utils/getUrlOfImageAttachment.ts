import type { Attachment } from 'stream-chat';

export function getUrlOfImageAttachment(image: Attachment) {
  return image.image_url || image.thumb_url;
}
