import type { ImageResizeMode } from 'react-native';

export type Thumbnail = {
  resizeMode: ImageResizeMode;
  url: string;
  id?: string;
  thumb_url?: string;
  type?: string;
  flex?: number;
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
