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
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    // There is some issue with the url.
    // Simply return the original url, there is no need to break the app for this.
    console.warn(error);

    return url;
  }

  const originalHeight = parsedUrl.searchParams.get('oh');
  const originalWidth = parsedUrl.searchParams.get('ow');

  // If url is not from new cloudfront CDN (which offers fast image resizing), then return the url as it is.
  // Check for oh and ow parameters in the url, is just to differentiate between old and new CDN.
  // In case of old CDN we don't want to do any kind of resizing.
  const isResizableUrl = url.includes('.stream-io-cdn.com') && originalHeight && originalWidth;

  if (!isResizableUrl || (!height && !width)) return url;

  if (height) {
    parsedUrl.searchParams.set('h', `${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`);
  }

  if (width) {
    parsedUrl.searchParams.set('w', `${PixelRatio.getPixelSizeForLayoutSize(Number(width))}`);
  }

  parsedUrl.searchParams.set('resize', `${resize}`);

  return parsedUrl.toString();
}
