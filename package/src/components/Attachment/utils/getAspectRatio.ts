import type { Attachment } from 'stream-chat';

import type { DefaultAttachmentType } from '../../../types/types';

/**
 * Returns the aspect ratio of an image attachment.
 *
 * @param image Image attachment.
 * @returns {number}
 */
export function getAspectRatio<At extends DefaultAttachmentType = DefaultAttachmentType>(
  image: Attachment<At>,
) {
  if (image.type !== 'image') {
    throw new Error('getAspectRatio() can only be called on an image attachment');
  }

  if (!image.height || !image.width) return 1;

  return image.width / image.height;
}
