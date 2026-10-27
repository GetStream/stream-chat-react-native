import { StateStore } from '@stream-io/state-store';

import type { DictationError, DictationStateValue } from '../../native-specs/NativeAIDictation';

export type DictationStoreState = {
  state: DictationStateValue;
  transcript: string;
  isRecording: boolean;
  error?: DictationError | null;
  /**
   * Who started the current dictation, as passed to `useDictation`, or `null`. Lets a consumer
   * such as `ComposerView` pick up only the transcripts meant for it.
   */
  source?: string | null;
};

const DEFAULT_STATE: DictationStoreState = {
  state: 'idle',
  transcript: '',
  isRecording: false,
  error: null,
  source: null,
};

/** The `source` of dictation started by the composer's own `SpeechToTextButton`. */
export const COMPOSER_DICTATION_SOURCE = 'composer';

export const dictationStore = new StateStore<DictationStoreState>(DEFAULT_STATE);

const reset = () => dictationStore.next(DEFAULT_STATE);

export const dictationStoreApi = { reset };
