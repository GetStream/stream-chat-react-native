import { createGenerateVideoThumbnails } from 'stream-chat-react-native-core/src/utils/createGenerateVideoThumbnails';

import { createVideoThumbnails, type VideoThumbnailResult } from '../native/videoThumbnail';

export const generateThumbnails: (
  uris: string[],
) => Promise<Record<string, VideoThumbnailResult>> = createGenerateVideoThumbnails({
  createVideoThumbnails,
});
