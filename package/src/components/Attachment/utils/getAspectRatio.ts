import type { Attachment } from 'stream-chat';

import { FileTypes } from '../../../types/types';

/**
 * Returns the aspect ratio (width / height) of an image attachment or video thumbnail.
 *
 * @param attachment Image attachment or video thumbnail.
 * @returns The aspect ratio, or 1 when the original size is unknown.
 * @throws When the attachment is not an image or a video.
 */
export function getAspectRatio(attachment: Attachment) {
  if (!(attachment.type === FileTypes.Image || attachment.type === FileTypes.Video)) {
    throw new Error(
      'getAspectRatio() can only be called on an image attachment or video thumbnail',
    );
  }

  if (!attachment.original_width || !attachment.original_height) {
    return 1;
  }

  return attachment.original_width / attachment.original_height;
}
