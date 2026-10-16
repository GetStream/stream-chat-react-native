let Clipboard: { setString: (string: string) => void } | undefined;

try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (_) {
  // do nothing
}

export const setClipboardString = Clipboard
  ? (string: string) => (Clipboard ? Clipboard.setString(string) : {})
  : undefined;
