let Clipboard: { setString: (string: string) => void } | undefined;

try {
  Clipboard = require('expo-clipboard');
} catch (e) {
  // do nothing
}

if (!Clipboard) {
  console.log(
    'expo-clipboard is not installed. Install this library if you want to enable copy to clipboard support.',
  );
}

export const setClipboardString = Clipboard
  ? (string: string) => Clipboard?.setString(string)
  : null;
