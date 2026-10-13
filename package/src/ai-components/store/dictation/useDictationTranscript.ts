import { useStateStore } from '@stream-io/state-store/react-bindings';

import { dictationStore, type DictationStoreState } from './store';

const selector = ({ transcript }: DictationStoreState) => ({
  transcript,
});

export const useDictationTranscript = () => useStateStore(dictationStore, selector);
