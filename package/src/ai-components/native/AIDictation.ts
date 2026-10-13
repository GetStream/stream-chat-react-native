import { NativeEventEmitter, Platform } from 'react-native';

import NativeAIDictation, {
  type DictationError,
  type DictationResult,
  type DictationStartOptions,
  type DictationState,
} from '../native-specs/NativeAIDictation';

// Event names emitted by the native module (see `AIDictation.mm` and `AIDictationModule.kt`).
const ON_STATE_EVENT = 'AIDictationOnState';
const ON_RESULT_EVENT = 'AIDictationOnResult';
const ON_ERROR_EVENT = 'AIDictationOnError';

let eventEmitter: NativeEventEmitter | undefined;
const getEventEmitter = () => {
  if (!eventEmitter && NativeAIDictation) {
    eventEmitter = new NativeEventEmitter(NativeAIDictation);
  }
  return eventEmitter;
};

const noop = () => {};

/**
 * Whether the native dictation module is part of this build. It is always compiled in on Android,
 * while on iOS it is opt-in: add `$StreamChatEnableDictation = true` to your
 * `Podfile` (or use the `stream-chat-expo` config plugin) and run `pod install`.
 */
export const isDictationAvailable = () => NativeAIDictation != null;

let hasWarnedAboutMissingModule = false;
export const warnIfDictationUnavailable = () => {
  if (!__DEV__ || hasWarnedAboutMissingModule || isDictationAvailable()) {
    return;
  }
  hasWarnedAboutMissingModule = true;
  console.warn(
    Platform.OS === 'ios'
      ? '[stream-chat-react-native/ai-components] Dictation is not compiled into this build, so the speech-to-text button is hidden. Add `$StreamChatEnableDictation = true` to your Podfile (Expo: add the `stream-chat-expo` config plugin) and run `pod install`.'
      : '[stream-chat-react-native/ai-components] Dictation is not available in this build, so the speech-to-text button is hidden.',
  );
};

// Low-level API
export const AIDictation = {
  start(options?: DictationStartOptions) {
    NativeAIDictation?.start(options);
  },
  stop() {
    NativeAIDictation?.stop();
  },
  cancel() {
    NativeAIDictation?.cancel();
  },
  isRecording() {
    return NativeAIDictation?.isRecording() ?? false;
  },
  addResultListener(listener: (result: DictationResult) => void) {
    const sub = getEventEmitter()?.addListener(ON_RESULT_EVENT, (event) =>
      listener(event as DictationResult),
    );
    return sub ? () => sub.remove() : noop;
  },
  addStateListener(listener: (payload: DictationState) => void) {
    const sub = getEventEmitter()?.addListener(ON_STATE_EVENT, (event) =>
      listener(event as DictationState),
    );
    return sub ? () => sub.remove() : noop;
  },
  addErrorListener(listener: (payload: DictationError) => void) {
    const sub = getEventEmitter()?.addListener(ON_ERROR_EVENT, (event) =>
      listener(event as DictationError),
    );
    return sub ? () => sub.remove() : noop;
  },
};
