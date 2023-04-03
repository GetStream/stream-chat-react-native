let Clipboard: { setString: (string: string) => void } | undefined;

try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  // do nothing
  console.log('@react-native-clipboard/clipboard is not installed');
}

export const setClipboardString = Clipboard
  ? (string: string) => (Clipboard ? Clipboard.setString(string) : {})
  : null;
