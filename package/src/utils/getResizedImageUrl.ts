import { PixelRatio } from 'react-native';

type GetResizedImageUrlParams = {
  url: string;
  height?: string | number;
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
export function getResizedImageUrl({ height, url, width }: GetResizedImageUrlParams) {
  const isResizableUrl = url.includes('&h=*') && url.includes('&w=*') && url.includes('&resize=*');

  if (!isResizableUrl || (!height && !width)) return url;

  let resizedUrl = url;

  if (height) {
    resizedUrl = resizedUrl.replace(
      'h=*',
      `h=${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`,
    );
  }

  if (width) {
    resizedUrl = resizedUrl.replace(
      'w=*',
      `w=${PixelRatio.getPixelSizeForLayoutSize(Number(width))}`,
    );
  }

  return resizedUrl.replace('resize=*', `resize=clip`);
}
