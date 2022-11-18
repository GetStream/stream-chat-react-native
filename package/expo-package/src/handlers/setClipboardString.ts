let Clipboard: { setString: (string: string) => void } | undefined;

try {
  Clipboard = require('expo-clipboard');
  console.log({ Clipboard });
} catch (e) {
  // do nothing
}

export const setClipboardString =
  Clipboard !== undefined ? (string: string) => Clipboard.setString(string) : null;
