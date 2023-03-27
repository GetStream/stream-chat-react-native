let DocumentPicker;

try {
  DocumentPicker = require('expo-document-picker').default;
} catch (error) {
  console.log('expo-document-picker is not installed');
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
