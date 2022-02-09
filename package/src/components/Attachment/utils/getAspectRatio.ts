import type { Attachment } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

/**
 * Returns the aspect ratio of an image attachment.
 *
 * @param image Image attachment.
 * @returns {number}
 */
export function getAspectRatio<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(image: Attachment<StreamChatClient>) {
  if (image.type !== 'image') {
    throw new Error('getAspectRatio() can only be called on an image attachment');
  }

  if (!image.original_width || !image.original_height) return 1;

  return image.original_width / image.original_height;
}
