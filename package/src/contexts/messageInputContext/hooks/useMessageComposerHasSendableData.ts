import type { EditingAuditState } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';

import { useStateStore } from '../../../hooks/useStateStore';
import { useMessageInputContext } from '../MessageInputContext';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageComposerHasSendableData = () => {
  const { allowSendBeforeAttachmentsUpload } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  return allowSendBeforeAttachmentsUpload
    ? !messageComposer.contentIsEmpty
    : messageComposer.hasSendableData;
};
