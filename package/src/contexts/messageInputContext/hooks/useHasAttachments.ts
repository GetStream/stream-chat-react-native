import type { AttachmentManagerState } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';

import { useStateStore } from '../../../hooks/useStateStore';

const stateSelector = (state: AttachmentManagerState) => ({
  hasAttachments: state.attachments.length > 0,
});

export const useHasAttachments = () => {
  const { attachmentManager } = useMessageComposer();
  const { hasAttachments } = useStateStore(attachmentManager.state, stateSelector);
  return hasAttachments;
};
