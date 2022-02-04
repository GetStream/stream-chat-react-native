import { PixelRatio } from 'react-native';

type GetResizedImageUrlParams = {
  url: string;
  height?: string | number;
  resize?: 'clip' | 'crop' | 'fill' | 'scale';
  width?: string | number;
};

/**
 * Any file or image upload done through stream's chat SDK or components get uploaded
 * to CloudFront CDN. Following function returns a url of resized image (to given width and height).
 * It can be used to avoid rendering heavy images on UI, for the sake of performance.
 *
 * This function accepts an object with following properties:
 * - height: height of the resized image.
 * - url: url of the image.
 * - width: width of the resized image.
 *
 * @returns {string} Url of the image with given height and width.
 */
export function getResizedImageUrl({
  height,
  resize = 'clip',
  url,
  width,
}: GetResizedImageUrlParams) {
  // Check if url belongs to cloudfront CDN
  const isResizableUrl = url.includes('.stream-io-cdn.com');
  if (!isResizableUrl || (!height && !width)) return url;

  const parsedUrl = new URL(url);

  if (height) {
    parsedUrl.searchParams.set('h', `${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`);
  }

  if (width) {
    parsedUrl.searchParams.set('w', `${PixelRatio.getPixelSizeForLayoutSize(Number(width))}`);
  }

  parsedUrl.searchParams.set('resize', `${resize}`);

  return parsedUrl.toString();
}
