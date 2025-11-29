import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type DictationStartOptions = {
  language?: string;
  interimResults?: boolean;
  silenceTimeoutMs?: number;
};

export type DictationResult = {
  text: string;
  isFinal: boolean;
};

export type DictationStateValue =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'stopping';
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

  readonly onState: CodegenTypes.EventEmitter<DictationState>;
  readonly onResult: CodegenTypes.EventEmitter<DictationResult>;
  readonly onError: CodegenTypes.EventEmitter<DictationError>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AIDictation');
