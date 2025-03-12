import type { Attachment } from 'stream-chat';

import { FileTypes } from '../../../types/types';

/**
 * Returns the aspect ratio of an image attachment.
 *
 * @param image Image attachment.
 * @returns {number}
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
