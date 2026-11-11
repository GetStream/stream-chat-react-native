import { Platform } from 'react-native';

import NativeAIAgent from '../native-specs/NativeAIAgent';

// Used when the app is built without the SDK's native code, so the id still holds for as long
// as the app runs.
let inMemoryId: string | undefined;

const randomHex = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');

/**
 * A stable identifier for this install, for addressing client tool calls to it. Send it with the
 * person's questions (`client_id`) so the agent addresses the calls it makes while answering to
 * this install, and pass it to `AIToolApprover` as `clientId`.
 */
export const AIClientIdentity = {
  /**
   * This install's identifier, created on first use and kept until the app's data is cleared:
   * `ios-…` in `UserDefaults`, `android-…` in a file that isn't backed up, as in the native AI
   * SDKs. Without the SDK's native code it lives in memory, for as long as the app runs.
   */
  installId(): string {
    try {
      const saved = NativeAIAgent?.installId();
      if (saved) return saved;
    } catch {
      // Falls back to an id kept in memory.
    }
    inMemoryId ??= `${Platform.OS}-${randomHex(32)}`;
    return inMemoryId;
  },
};
