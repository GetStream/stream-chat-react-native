import { StateStore } from '@stream-io/state-store';
import type {
  DictationError,
  DictationStateValue,
} from '../../native-specs/NativeAIDictation';

export type DictationStoreState = {
  state: DictationStateValue;
  transcript: string;
  isRecording: boolean;
  error?: DictationError | null;
};

const DEFAULT_STATE: DictationStoreState = {
  state: 'idle',
  transcript: '',
  isRecording: false,
  error: null,
};

export const dictationStore = new StateStore<DictationStoreState>(
  DEFAULT_STATE,
);

const reset = () => dictationStore.next(DEFAULT_STATE);

export const dictationStoreApi = { reset };
