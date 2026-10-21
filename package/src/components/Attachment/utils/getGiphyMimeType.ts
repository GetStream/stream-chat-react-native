/**
 * Infers the MIME type of a Giphy asset from its URL.
 *
 * @param giphyUrl The Giphy attachment URL.
 * @returns `video/mp4` or `image/webp` for those extensions, `image/gif` otherwise.
 */
export function getGiphyMimeType(giphyUrl: string): string {
  if (giphyUrl.includes('.mp4')) {
    return 'video/mp4';
  } else if (giphyUrl.includes('.webp')) {
    return 'image/webp';
  }
  return 'image/gif';
}
