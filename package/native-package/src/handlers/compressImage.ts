import { compressImage as compressImageNative } from '../native';

export const compressImage = async ({
  uri,
  compressImageQuality = 1,
}: {
  uri: string;
  compressImageQuality?: number;
}) => {
  try {
    const result = await compressImageNative(uri, {
      compressImageQuality: Math.min(Math.max(0, compressImageQuality), 1),
    });
    return result;
  } catch (error) {
    console.log('Error resizing image:', error);
    return null;
  }
};
