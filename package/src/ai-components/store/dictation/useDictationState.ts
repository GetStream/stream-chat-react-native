import { useStateStore } from '@stream-io/state-store/react-bindings';

import { dictationStore, type DictationStoreState } from './store';

const selector = ({ state, isRecording, error, source }: DictationStoreState) => ({
  state,
  isRecording,
  error,
  source,
});

export const useDictationState = () => useStateStore(dictationStore, selector);
