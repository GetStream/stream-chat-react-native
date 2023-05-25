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
    }
  : null;
