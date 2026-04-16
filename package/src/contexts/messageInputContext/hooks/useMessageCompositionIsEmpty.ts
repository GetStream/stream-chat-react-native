import type { EditingAuditState } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';

import { useStateStore } from '../../../hooks/useStateStore';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageCompositionIsEmpty = () => {
  const messageComposer = useMessageComposer();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  return messageComposer.compositionIsEmpty;
};
