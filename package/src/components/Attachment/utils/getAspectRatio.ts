import type { Attachment } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

/**
 * Returns the aspect ratio of an image attachment.
 *
 * @param image Image attachment.
 * @returns {number}
 */
export function getAspectRatio<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(attachment: Attachment<StreamChatGenerics>) {
  if (!(attachment.type === 'image' || attachment.type === 'video')) {
    throw new Error(
      'getAspectRatio() can only be called on an image attachment or video thumbnail',
    );
  }

  if (!attachment.original_width || !attachment.original_height) return 1;

  return attachment.original_width / attachment.original_height;
}
