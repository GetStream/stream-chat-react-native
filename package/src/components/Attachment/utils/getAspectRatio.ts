import type { Attachment } from 'stream-chat';

import type { DefaultAttachmentType } from '../../../types/types';

export function getAspectRatio<At extends DefaultAttachmentType = DefaultAttachmentType>(
  image: Attachment<At>,
) {
  if (!image.height || !image.width) return 1;

  return image.width / image.height;
}
