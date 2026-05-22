import NativeStreamVideoThumbnail, { type VideoThumbnailResult } from './NativeStreamVideoThumbnail';

export type { VideoThumbnailResult } from './NativeStreamVideoThumbnail';

export const createVideoThumbnails = async (urls: string[]): Promise<VideoThumbnailResult[]> => {
  const results = await NativeStreamVideoThumbnail.createVideoThumbnails(urls);
  return Array.from(results);
};
