let Clipboard:
  | {
      setString?: (string: string) => void;
      setStringAsync?: (string: string) => Promise<boolean>;
    }
  | undefined;

try {
  Clipboard = require('expo-clipboard');
} catch (_) {
  // `expo-clipboard` is not installed.
}

// `expo-clipboard` removed the synchronous `setString` in favour of `setStringAsync`; older
// versions only have `setString`.
export const setClipboardString =
  Clipboard && (Clipboard.setStringAsync || Clipboard.setString)
    ? (string: string) => {
        if (Clipboard?.setStringAsync) {
          Clipboard.setStringAsync(string).catch(() => undefined);
        } else {
          Clipboard?.setString?.(string);
        }
      }
    : undefined;
