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

let DocumentPicker: {
  pickMultiple: (opts?: { type: string[] }) => Promise<ResponseValue[]>;
  types: { allFiles: string };
};

try {
  DocumentPicker = require('react-native-document-picker').default;
} catch (err) {
  console.log('react-native-document-picker is not installed');
}

export const pickDocument = DocumentPicker
  ? async ({ maxNumberOfFiles }: { maxNumberOfFiles: number }) => {
      try {
        let res = await DocumentPicker.pickMultiple({
          type: [DocumentPicker.types.allFiles],
        });

        if (maxNumberOfFiles && res.length > maxNumberOfFiles) {
          res = res.slice(0, maxNumberOfFiles);
        }

        return {
          cancelled: false,
          docs: res.map(({ name, size, type, uri }) => ({
            name,
            size,
            type,
            uri,
          })),
        };
      } catch (err) {
        return {
          cancelled: true,
        };
      }
    }
  : null;
