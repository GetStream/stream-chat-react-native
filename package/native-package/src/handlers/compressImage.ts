// @ts-ignore this module does not have a type declaration
import ImageResizer from 'react-native-image-resizer';

type CompressImageParams = {
  compressImageQuality: number;
  height: number;
  uri: string;
  width: number;
};

export const compressImage = async ({
  compressImageQuality = 1,
  height,
  uri,
  width,
}: CompressImageParams) => {
  try {
    const { uri: compressedUri } = await ImageResizer.createResizedImage(
      uri,
      height,
      width,
      'JPEG',
      Math.min(Math.max(0, compressImageQuality), 1) * 100,
      0,
      undefined,
      false,
      'cover',
    );
    return compressedUri;
  } catch (error) {
    console.log(error);
    return uri;
  }
};
