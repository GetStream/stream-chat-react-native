import { createVideoThumbnails } from '../native/videoThumbnail';

export const generateThumbnail = async ({
  uri,
}: {
  maxHeight?: number;
  maxWidth?: number;
  quality?: number;
  timeMs?: number;
  uri: string;
}): Promise<string | undefined> => {
  const [thumbnailUri] = await createVideoThumbnails([uri]);
  return thumbnailUri || undefined;
};
