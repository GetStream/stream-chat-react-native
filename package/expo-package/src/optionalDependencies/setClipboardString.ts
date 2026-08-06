let Clipboard:
  | {
      setString?: (text: string) => void;
      setStringAsync?: (text: string) => Promise<boolean>;
    }
  | undefined;

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

export const setClipboardString =
  Clipboard && (Clipboard.setStringAsync || Clipboard.setString)
    ? (text: string) => {
        try {
          // `expo-clipboard` removed the synchronous `setString` in favour of
          // the async API. Keep this handler synchronous (void return, like the
          // legacy `setString`) and fire the async write without awaiting. Fall
          // back to `setString` for older versions.
          if (Clipboard?.setStringAsync) {
            Clipboard.setStringAsync(text).catch((error: unknown) => {
              console.log('Copying to clipboard failed...', error);
            });
          } else {
            Clipboard?.setString?.(text);
          }
        } catch (error) {
          console.log('Copying to clipboard failed...', error);
        }
      }
    : null;
