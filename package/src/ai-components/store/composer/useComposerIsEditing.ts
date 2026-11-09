import { useStateStore } from '@stream-io/state-store/react-bindings';

import { type ComposerState } from './store';

import { useMessageComposerContext } from '../../contexts';

const selector = ({ isEditing }: ComposerState) => ({
  isEditing: !!isEditing,
});

/** Whether the person is editing a message they sent. */
export const useComposerIsEditing = () => {
  const { state } = useMessageComposerContext();
  return useStateStore(state, selector);
};
