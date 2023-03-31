let Clipboard: { setString: (string: string) => void } | undefined;

try {
  Clipboard = require('expo-clipboard').default;
} catch (e) {
  // do nothing
  console.log('expo-clipboard is not installed');
}

export const setClipboardString = Clipboard
  ? (string: string) => Clipboard?.setString(string)
  : null;
