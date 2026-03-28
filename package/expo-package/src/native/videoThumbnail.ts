import NativeStreamVideoThumbnail from './NativeStreamVideoThumbnail';

export const createVideoThumbnails = async (urls: string[]): Promise<string[]> => {
  const results = await NativeStreamVideoThumbnail.createVideoThumbnails(urls);
  return Array.from(results);
};
