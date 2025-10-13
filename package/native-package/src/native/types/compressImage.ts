export type ImageFormat = 'JPEG' | 'PNG' | 'WEBP';

export type CompressImageOptions = {
  base64?: boolean;
  compressImageQuality?: number;
  format?: ImageFormat;
};
