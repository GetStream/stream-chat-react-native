import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen spec of the native dictation module.
 *
 * Duplicated byte for byte in `package/native-package/src/native/NativeAIDictation.ts` and
 * `package/expo-package/src/native/NativeAIDictation.ts`, the copies codegen reads;
 * `yarn validate-entry-isolation` fails when they drift apart.
 *
 * Events go through `addListener`/`removeListeners` and a `NativeEventEmitter` (see
 * `../native/AIDictation.ts`), because codegen `EventEmitter` properties are not understood by
 * every React Native version the SDK supports.
 */

export type DictationStartOptions = {
  language?: string;
  interimResults?: boolean;
  silenceTimeoutMs?: number;
};

export type DictationResult = {
  text: string;
  isFinal: boolean;
};

export type DictationStateValue = 'idle' | 'starting' | 'listening' | 'stopping';
export type DictationState = { state: DictationStateValue };

export type DictationError = {
  code: string;
  message: string;
};

export interface Spec extends TurboModule {
  start(options?: DictationStartOptions): void;
  stop(): void;
  cancel(): void;
  isRecording(): boolean;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// `get` returns null when absent: the module is only compiled in when dictation is enabled (always
// on Android, opt-in on iOS), and importing the AI entry point must not throw without it.
export default TurboModuleRegistry.get<Spec>('AIDictation');
