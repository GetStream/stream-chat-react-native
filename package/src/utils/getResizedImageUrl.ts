import { PixelRatio } from 'react-native';

type GetResizedImageUrlParams = {
  height: number;
  url: string;
  width: number;
};

export function getResizedImageUrl({ height, url, width }: GetResizedImageUrlParams) {
  const isResizableUrl = url.includes('&h=*') && url.includes('&w=*') && url.includes('&resize=*');

  if (!isResizableUrl) return url;

  return url
    .replace('h=*', `h=${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`)
    .replace('w=*', `w=${PixelRatio.getPixelSizeForLayoutSize(Number(width))}`)
    .replace('resize=*', `resize=clip`);
}
