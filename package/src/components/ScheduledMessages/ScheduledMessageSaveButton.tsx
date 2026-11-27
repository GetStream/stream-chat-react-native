import React, { useEffect } from 'react';

import type { EditingAuditState, MessageComposerState } from 'stream-chat';
import { CORE_NOTIFICATION_TYPE, ScheduledMessageBlockReason } from 'stream-chat';

import { useEditedScheduledMessage } from './hooks/useEditedScheduledMessage';
import { RescheduleFailedMessageButton } from './RescheduleFailedMessageButton';
import { isDeletedQuotedMessage } from './utils/quote';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../hooks/useStateStore';
import { EditButton } from '../MessageInput/components/OutputButtons/EditButton';

const quotedMessageSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

const editingAuditSelector = (state: EditingAuditState) => state;

/**
 * The save button while the composer edits a scheduled message. Save is disabled while the message
 * can't be scheduled or quotes a deleted message, and a toast says so when a command is the reason.
 */
export const ScheduledMessageSaveButton = () => {
  const messageComposer = useMessageComposer();
  const { isFailed } = useEditedScheduledMessage();
  const { quotedMessage } = useStateStore(messageComposer.state, quotedMessageSelector);
  // The block reason and the empty check read the composition, so this re-renders on every change
  // to it. The parent's re-render isn't enough: React Compiler caches this element (it has no props).
  useStateStore(messageComposer.editingAuditState, editingAuditSelector);

  const { scheduleBlockReason } = messageComposer;
  const blockedByCommand = scheduleBlockReason === ScheduledMessageBlockReason.Command;
  const disabled =
    messageComposer.compositionIsEmpty ||
    !!scheduleBlockReason ||
    isDeletedQuotedMessage(quotedMessage);

  useEffect(() => {
    if (!blockedByCommand) return;
    messageComposer.notifyWarning('This message cannot be scheduled', {
      metadata: { reason: ScheduledMessageBlockReason.Command },
      type: CORE_NOTIFICATION_TYPE.scheduledMessageBlocked,
    });
  }, [blockedByCommand, messageComposer]);

  return isFailed ? (
    <RescheduleFailedMessageButton disabled={disabled} />
  ) : (
    <EditButton disabled={disabled} />
  );
};
