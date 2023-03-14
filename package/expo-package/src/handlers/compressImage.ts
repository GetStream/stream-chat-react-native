import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async ({
  compressImageQuality = 1,
  uri,
}: {
  uri: string;
  compressImageQuality?: number;
}) => {
  const { uri: compressedUri } = await ImageManipulator.manipulateAsync(uri, [], {
    compress: Math.min(Math.max(0, compressImageQuality), 1),
  });
  return compressedUri;
};
