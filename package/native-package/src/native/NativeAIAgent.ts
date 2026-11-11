import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen spec of the native module behind the agent components: this install's identifier and
 * the sign-ins of tool calls.
 *
 * This file is duplicated (byte for byte) in `package/native-package/src/native/NativeAIAgent.ts`
 * and `package/expo-package/src/native/NativeAIAgent.ts`, which are the copies codegen reads.
 * `yarn validate-entry-isolation` fails if they drift apart.
 */
export interface Spec extends TurboModule {
  /** This install's identifier, created on first use and kept in storage that isn't backed up. */
  installId(): string;
  /**
   * Opens `url` in the platform's web authentication session and resolves with the URL the page
   * handed back to `callbackScheme`, or an empty string when the person closed it. Rejects when
   * the session couldn't be opened.
   */
  openAuthSession(url: string, callbackScheme: string): Promise<string>;
}

// `get` rather than `getEnforcing`, so importing the AI entry point never throws in an app built
// without the module, such as one on an older version of the SDK's native code.
export default TurboModuleRegistry.get<Spec>('AIAgent');
