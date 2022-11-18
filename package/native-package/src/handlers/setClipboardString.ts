let Clipboard: { setString: (string: string) => void };

try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  // do nothing
}

export const setClipboardString = Clipboard
  ? (string: string) => Clipboard.setString(string)
  : null;
