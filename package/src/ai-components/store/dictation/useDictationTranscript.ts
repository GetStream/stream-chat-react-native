import { dictationStore, type DictationStoreState } from './store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

const selector = ({ transcript }: DictationStoreState) => ({
  transcript,
});

export const useDictationTranscript = () =>
  useStateStore(dictationStore, selector);
