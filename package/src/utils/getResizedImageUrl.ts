import { PixelRatio } from 'react-native';

import {
  chatConfigContextDefaultvalue,
  ChatConfigContextValue,
} from '../contexts/chatConfigContext/ChatConfigContext';

export type GetResizedImageUrlParams = Pick<ChatConfigContextValue, 'resizableCDNHosts'> & {
  url: string;
  height?: string | number;
  resize?: 'clip' | 'crop' | 'fill' | 'scale';
  width?: string | number;
};

/**
 * Returns the URL of an image resized to the given size, to avoid rendering oversized images.
 * URLs outside `resizableCDNHosts`, without the `oh` and `ow` query parameters, or when neither
 * `height` nor `width` is given are returned unchanged.
 *
 * @param params.url The image URL.
 * @param params.height Target height in layout units, converted to pixels.
 * @param params.width Target width in layout units, converted to pixels.
 * @param params.resize The resize mode. Defaults to 'clip'.
 * @param params.resizableCDNHosts CDN hosts whose image URLs can be resized.
 * @returns The resized image URL.
 */
export function getResizedImageUrl({
  height,
  resizableCDNHosts = chatConfigContextDefaultvalue.resizableCDNHosts,
  resize = 'clip',
  url,
  width,
}: GetResizedImageUrlParams) {
  try {
    const parsedUrl = new URL(url);

    const originalHeight = parsedUrl.searchParams.get('oh');
    const originalWidth = parsedUrl.searchParams.get('ow');

    // `oh` and `ow` only appear on the new CDN, which resizes; the old CDN must not be resized.

    const isResizableUrl =
      resizableCDNHosts?.some((rCDNh) => url.includes(rCDNh)) && originalHeight && originalWidth;

    if (!isResizableUrl || (!height && !width)) {
      return url;
    }

    if (height) {
      parsedUrl.searchParams.set('h', `${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`);
    }

    if (width) {
      parsedUrl.searchParams.set('w', `${PixelRatio.getPixelSizeForLayoutSize(Number(width))}`);
    }

    parsedUrl.searchParams.set('resize', `${resize}`);

    return parsedUrl.toString();
  } catch (error) {
    // An unparsable URL is returned as is rather than breaking the render.
    console.warn(error);

    return url;
  }
}
