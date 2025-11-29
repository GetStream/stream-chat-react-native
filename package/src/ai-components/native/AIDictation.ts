import NativeAIDictation, {
  type DictationError,
  type DictationResult,
  type DictationStartOptions,
  type DictationState,
} from '../native-specs/NativeAIDictation';

// Low-level API
export const AIDictation = {
  start(options?: DictationStartOptions) {
    NativeAIDictation.start(options);
  },
  stop() {
    NativeAIDictation.stop();
  },
  cancel() {
    NativeAIDictation.cancel();
  },
  isRecording() {
    return NativeAIDictation.isRecording();
  },
  addResultListener(listener: (result: DictationResult) => void) {
    const sub = NativeAIDictation.onResult(listener);
    return () => sub.remove();
  },
  addStateListener(listener: (payload: DictationState) => void) {
    const sub = NativeAIDictation.onState(listener);
    return () => sub.remove();
  },
  addErrorListener(listener: (payload: DictationError) => void) {
    const sub = NativeAIDictation.onError(listener);
    return () => sub.remove();
  },
};
