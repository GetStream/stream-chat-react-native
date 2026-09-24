import type { EditingAuditState } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';
import { pendingUploadsEnabledSelector } from './usePendingUploadsEnabled';

import { useStateStore } from '../../../hooks/useStateStore';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageComposerHasSendableData = () => {
  const messageComposer = useMessageComposer();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  // `hasSendableData` also depends on whether pending uploads may be sent, which is composer config
  // rather than composer state — so toggling `attachments.pendingUploadsEnabled` re-renders too.
  useStateStore(messageComposer.configState, pendingUploadsEnabledSelector);
  return messageComposer.hasSendableData;
};
