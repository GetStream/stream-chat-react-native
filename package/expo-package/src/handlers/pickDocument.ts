import * as DocumentPicker from 'expo-document-picker';

export const pickDocument = async () => {
  try {
    const { type, ...rest } = await DocumentPicker.getDocumentAsync();
    if (type === 'cancel') {
      return {
        cancelled: true,
      };
    }
    return {
      cancelled: false,
      docs: [rest],
    };
  } catch (err) {
    return {
      cancelled: true,
    };
  }
};
