import { TextComposerState } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';

import { useStateStore } from '../../../hooks/useStateStore';

const activeCommandSelector = (state: TextComposerState) => ({
  command: state.command,
});

export const useActiveCommand = () => {
  const { textComposer } = useMessageComposer();
  const state = useStateStore(textComposer.state, activeCommandSelector);

  return state.command;
};
