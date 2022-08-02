/**
 *
 * @param giphyUrl The giphy attachment url
 * @returns mimeType for the giphy attachment
 */
export function getGiphyMimeType(giphyUrl: string): string {
  if (giphyUrl.includes('.mp4')) {
    return 'video/mp4';
  } else if (giphyUrl.includes('.webp')) {
    return 'image/webp';
  }
  return 'image/gif';
}
