import type { MessageComposerState } from 'stream-chat';
import { SCHEDULED_MESSAGE_STATUS } from 'stream-chat';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: MessageComposerState) => ({
  editedScheduledMessage: state.editedScheduledMessage,
});

/**
 * The scheduled message open in the composer. `isFailed` means it failed to send, so saving
 * schedules it again instead of updating it.
 */
export const useEditedScheduledMessage = () => {
  const messageComposer = useMessageComposer();
  const { editedScheduledMessage } = useStateStore(messageComposer.state, selector);

  return {
    editedScheduledMessage: editedScheduledMessage ?? undefined,
    isFailed: editedScheduledMessage?.status === SCHEDULED_MESSAGE_STATUS.Failed,
  };
};
