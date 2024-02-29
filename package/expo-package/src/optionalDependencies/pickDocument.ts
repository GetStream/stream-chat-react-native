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
            assets,
            cancelled: false,
          };
        }
        // Applicable to older version of expo-document-picker
        return {
          assets: [rest],
          cancelled: false,
        };
      } catch (err) {
        return {
          cancelled: true,
        };
      }
    }
  : null;
