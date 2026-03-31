import { createVideoThumbnails } from '../native/videoThumbnail';

export const generateThumbnails = async (uris: string[]): Promise<Array<string | undefined>> => {
  if (!uris.length) {
    return [];
  }

  const uniqueUris: string[] = [];
  const uriToIndex = new Map<string, number>();

  uris.forEach((uri) => {
    if (!uriToIndex.has(uri)) {
      uriToIndex.set(uri, uniqueUris.length);
      uniqueUris.push(uri);
    }
  });

  const uniqueThumbnailUris = await createVideoThumbnails(uniqueUris);

  return uris.map((uri) => {
    const index = uriToIndex.get(uri);
    return index === undefined ? undefined : uniqueThumbnailUris[index] || undefined;
  });
};
