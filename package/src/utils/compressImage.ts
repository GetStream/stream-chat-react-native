import { NativeHandlers } from '../native';
import type { File } from '../types/types';

/**
 * Function to compress and Image and return the compressed Image URI
 * @param image
 * @param compressImageQuality
 * @returns string
 */
export const compressedImageURI = async (image: File, compressImageQuality?: number) => {
  const uri = image.uri || '';
  /**
   * We skip compression if:
   * - the file is from the camera as that should already be compressed
   * - the file has no height/width value to maintain for compression
   * - the compressImageQuality number is not present or is 1 (meaning no compression)
   */
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
