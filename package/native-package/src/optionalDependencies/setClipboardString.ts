type SetClipboardStringOptions = {
  onFailure?: (error: unknown) => void;
  onSuccess?: () => void;
};

let Clipboard: { setString?: (text: string) => void } | undefined;

try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  // do nothing
  console.log('@react-native-clipboard/clipboard is not installed');
}

export const setClipboardString = Clipboard?.setString
  ? (text: string, options?: SetClipboardStringOptions) => {
      try {
        Clipboard?.setString?.(text);
        options?.onSuccess?.();
      } catch (error) {
        console.log('Copying to clipboard failed...', error);
        options?.onFailure?.(error);
      }
    }
  : null;
