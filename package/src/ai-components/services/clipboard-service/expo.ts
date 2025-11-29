let Clipboard: { setString: (string: string) => void } | undefined;

try {
  // eslint-disable-next-line
  Clipboard = require('expo-clipboard');
} catch (_) {
  // do nothing
}

export const setClipboardString = Clipboard
  ? (string: string) => Clipboard?.setString(string)
  : undefined;
