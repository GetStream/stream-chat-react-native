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
  DocumentPicker = require('@react-native-documents/picker');
} catch (err) {
  // we do nothing as the alternative might be used
  // console.warn('@react-native-documents/picker is not installed');
}

if (!DocumentPicker) {
  try {
    DocumentPicker = require('react-native-document-picker').default;
    console.log(
      "You're using the react-native-document-picker library, which is no longer supported and has moved to @react-native-documents/picker. Things might not work as intended. Please migrate to the new library as soon as possible !",
    );
  } catch (err) {
    console.log(
      'Neither react-native-document-picker nor @react-native-documents/picker are installed.',
    );
  }
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
