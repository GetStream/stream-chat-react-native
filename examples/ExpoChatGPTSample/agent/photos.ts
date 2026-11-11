import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// The router takes photos inline, so they are shrunk first.
const MAX_IMAGE_WIDTH = 1280;

/** A photo the person picked, as the data URI the router takes. */
export const toDataUri = async (uri: string) => {
  const { base64 } = await manipulateAsync(uri, [{ resize: { width: MAX_IMAGE_WIDTH } }], {
    base64: true,
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  return `data:image/jpeg;base64,${base64}`;
};
