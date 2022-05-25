import type { ImageResizeMode } from 'react-native';

export type Thumbnail = {
  height: number;
  resizeMode: ImageResizeMode;
  url: string;
  width: number;
  id?: string;
  type?: string;
};

export type GallerySizeConfig = {
  gridHeight: number;
  gridWidth: number;
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
