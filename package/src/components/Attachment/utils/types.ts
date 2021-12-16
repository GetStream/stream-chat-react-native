import type { ImageResizeMode } from 'react-native';

export type Thumbnail = {
  height: number;
  resizeMode: ImageResizeMode;
  url: string;
  width: number;
};

export type GallerySizeConfig = {
  defaultHeight: number;
  defaultWidth: number;
  maxHeight: number;
  maxWidth: number;
  minHeight: number;
  minWidth: number;
};

export type ThumbnailGrid = Thumbnail[][];

export type GallerySizeAndThumbnailGrid = {
  height: number;
  thumbnailGrid: ThumbnailGrid;
  width: number;
  invertedDirections?: boolean;
};
