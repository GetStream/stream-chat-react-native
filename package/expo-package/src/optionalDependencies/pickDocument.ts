import mime from 'mime';

import { generateThumbnails } from './generateThumbnail';

let DocumentPicker;

try {
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  // do nothing
}

if (!DocumentPicker) {
  console.log(
    'expo-document-picker is not installed. Install this library if you want to enable file picker support.',
  );
}

export const pickDocument = DocumentPicker
  ? async () => {
      try {
        const addVideoThumbnails = async <T extends { type?: string; uri?: string }>(
          assets: T[],
        ) => {
          const videoUris = assets
            .filter(({ type, uri }) => type?.startsWith('video/') && !!uri)
            .map(({ uri }) => uri as string);
          const thumbnailResults = await generateThumbnails(videoUris);

          return assets.map((asset) => ({
            ...asset,
            thumb_url: asset.uri ? thumbnailResults[asset.uri]?.uri || undefined : undefined,
          }));
        };

        const result = await DocumentPicker.getDocumentAsync();

        // New data from latest version of expo-document-picker
        const { assets, canceled } = result;

        // Old data from older version of expo-document-picker
        const { type, ...rest } = result;

        // Applicable to latest version of expo-document-picker
        if (canceled) {
          return {
            cancelled: true,
          };
        }
        // Applicable to older version of expo-document-picker
        if (type === 'cancel') {
          return {
            cancelled: true,
          };
        }
        // Applicable to latest version of expo-document-picker
        if (assets) {
          return {
            assets: await addVideoThumbnails(
              assets.map((asset) => ({
                ...asset,
                type:
                  asset.mimeType ||
                  mime.getType(asset.name || asset.uri) ||
                  'application/octet-stream',
              })),
            ),
            cancelled: false,
          };
        }
        // Applicable to older version of expo-document-picker
        return {
          assets: await addVideoThumbnails([
            {
              ...rest,
              type:
                rest.mimeType || mime.getType(rest.name || rest.uri) || 'application/octet-stream',
            },
          ]),
          cancelled: false,
        };
      } catch (err) {
        return {
          cancelled: true,
        };
      }
    }
  : null;
