import { NativeHandlers } from '../native';
import type { File } from '../types/types';

/**
 * Compresses an image and returns the URI of the compressed image.
 *
 * @param image The image to compress.
 * @param compressImageQuality Compression quality. Compression is skipped when it is not a number
 * or is 1.
 * @returns The compressed image URI, or the original URI when compression is skipped.
 */
export const compressedImageURI = async (image: File, compressImageQuality?: number) => {
  const uri = image.uri || '';
  // Compression is skipped without a height or width, and when the quality is not a number or is 1.
  const compressedUri = await (!image.height ||
  !image.width ||
  typeof compressImageQuality !== 'number' ||
  compressImageQuality === 1
    ? uri
    : NativeHandlers.compressImage({
        compressImageQuality,
        height: image.height,
        uri,
        width: image.width,
      }));

  return compressedUri;
};
