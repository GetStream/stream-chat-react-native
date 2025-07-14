import { useCreateMessageComposer } from './useCreateMessageComposer';

import { useMessageComposerContext } from '../../messageComposerContext/MessageComposerContext';

export const useMessageComposer = () => {
  const messageComposerContext = useMessageComposerContext();

  return useCreateMessageComposer(messageComposerContext);
};
