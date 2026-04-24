/**
 * Types are approximated from what we need from the DocumentPicker API.
 *
 * For its full API, see https://github.com/react-native-documents/document-picker/blob/main/packages/document-picker/src/index.ts
 * */
import { generateThumbnails } from './generateThumbnail';

type ResponseValue = {
  name: string;
  size: number;
  type: string;
  uri: string;
};

type DocumentPickerType =
  | {
      pick: (opts?: { allowMultiSelection: boolean; type: string[] }) => Promise<ResponseValue[]>;
      types: { allFiles: string };
    }
  | undefined;

let DocumentPicker: DocumentPickerType;

try {
  DocumentPicker = require('@react-native-documents/picker');
} catch (err) {
  // do nothing
  console.log(
    'The @react-native-documents/picker is not installed. Installing it will enable you to pick and upload files from within your app.',
  );
}

export const pickDocument = DocumentPicker
  ? async ({ maxNumberOfFiles }: { maxNumberOfFiles: number }) => {
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

        if (!DocumentPicker) return { cancelled: true };
        let res: ResponseValue[] = await DocumentPicker.pick({
          allowMultiSelection: true,
          type: [DocumentPicker.types.allFiles],
        });

        if (maxNumberOfFiles && res.length > maxNumberOfFiles) {
          res = res.slice(0, maxNumberOfFiles);
        }

        return {
          assets: await addVideoThumbnails(
            res.map(({ name, size, type, uri }) => ({
              name,
              size,
              type,
              uri,
            })),
          ),
          cancelled: false,
        };
      } catch (err) {
        return {
          cancelled: true,
        };
      }
    }
  : null;
