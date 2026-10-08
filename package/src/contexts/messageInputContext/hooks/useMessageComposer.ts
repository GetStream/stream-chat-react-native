import { useMessageComposerContext } from '../../messageComposerContext/MessageComposerContext';

/**
 * The composer in use: the edit composer while a message is being edited, otherwise the thread's or
 * the channel's own.
 */
export const useMessageComposer = () => useMessageComposerContext().messageComposer;
