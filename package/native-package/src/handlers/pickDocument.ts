import DocumentPicker from 'react-native-document-picker';

export const pickDocument = async ({ maxNumberOfFiles }: { maxNumberOfFiles: number }) => {
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
};
