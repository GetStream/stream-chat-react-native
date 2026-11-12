import { useStateStore } from '@stream-io/state-store/react-bindings';

import { type ComposerState } from './store';

import { useMessageComposerContext } from '../../contexts';

const selector = ({ chatOption }: ComposerState) => ({
  chatOption,
});

/** The chat option picked for the next message, if any. */
export const useComposerChatOption = () => {
  const { state } = useMessageComposerContext();
  return useStateStore(state, selector);
};
