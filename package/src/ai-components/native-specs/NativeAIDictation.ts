import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen spec of the native dictation module.
 *
 * This file is duplicated (byte for byte) in `package/native-package/src/native/NativeAIDictation.ts`
 * and `package/expo-package/src/native/NativeAIDictation.ts`, which are the copies codegen reads.
 * `yarn validate-entry-isolation` fails if they drift apart.
 *
 * Events are delivered through `addListener`/`removeListeners` and a `NativeEventEmitter` (see
 * `../native/AIDictation.ts`) rather than codegen `EventEmitter` properties, since the latter are
 * not understood by the codegen of every React Native version the SDK supports (>= 0.76).
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

// `get` rather than `getEnforcing`: the module is only compiled in when dictation is enabled
// (always on Android, opt-in on iOS), and importing the AI entry point
// must not throw when it is absent.
export default TurboModuleRegistry.get<Spec>('AIDictation');
