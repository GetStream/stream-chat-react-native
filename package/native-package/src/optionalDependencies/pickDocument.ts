/**
 * Types are approximated from what we need from the DocumentPicker API.
 *
 * For its full API, see https://github.com/rnmods/react-native-document-picker/blob/master/src/index.tsx
 * */
type ResponseValue = {
  name: string;
  size: number;
  type: string;
  uri: string;
};

let DocumentPicker:
  | {
      pick: (opts?: { allowMultiSelection: boolean; type: string[] }) => Promise<ResponseValue[]>;
      types: { allFiles: string };
    }
  | undefined;

try {
  DocumentPicker = require('react-native-document-picker').default;
} catch (err) {
  console.log('react-native-document-picker is not installed');
}

export const pickDocument = DocumentPicker
  ? async ({ maxNumberOfFiles }: { maxNumberOfFiles: number }) => {
      try {
        if (!DocumentPicker) return { cancelled: true };
        let res: ResponseValue[] = await DocumentPicker.pick({
          allowMultiSelection: true,
          type: [DocumentPicker.types.allFiles],
        });

        if (maxNumberOfFiles && res.length > maxNumberOfFiles) {
          res = res.slice(0, maxNumberOfFiles);
        }

        return {
          assets: res.map(({ name, size, type, uri }) => ({
            mimeType: type,
            name,
            size,
            uri,
          })),
          cancelled: false,
        };
      } catch (err) {
        return {
          cancelled: true,
        };
      }
    }
  : null;
