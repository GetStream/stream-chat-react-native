import { PixelRatio } from 'react-native';

type GetResizedImageUrlParams = {
  height?: string | number;
  url?: string;
  width?: string | number;
};

export function getResizedImageUrl({ height, url, width }: GetResizedImageUrlParams) {
  if (!url) return undefined;

  const isResizableUrl = url.includes('&h=*') && url.includes('&w=*') && url.includes('&resize=*');

  if (!isResizableUrl) return url;

  return url
    .replace('h=*', `h=${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`)
    .replace('w=*', `w=${PixelRatio.getPixelSizeForLayoutSize(Number(width))}`)
    .replace('resize=*', `resize=clip`);
}
