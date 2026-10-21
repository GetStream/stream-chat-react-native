let Clipboard: { setString: (string: string) => void } | undefined;

try {
  Clipboard = require('expo-clipboard');
} catch (_) {
  // `expo-clipboard` is not installed.
}

export const setClipboardString = Clipboard
  ? (string: string) => Clipboard?.setString(string)
  : undefined;
