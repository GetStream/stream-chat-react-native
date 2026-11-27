import React, { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

import type { ScheduledMessageResponse } from 'stream-chat';

import { useEditedScheduledMessage } from './hooks/useEditedScheduledMessage';
import {
  RescheduleSheet,
  RescheduleSheetContext,
  type RescheduleSheetRequest,
} from './RescheduleSheet';

import { useMessageComposerAPIContext } from '../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { MessageComposer } from '../MessageInput/MessageComposer';

export type ScheduledMessageEditComposerProps = {
  /**
   * Called once the edit ends: saved, cancelled, or ended by the server. For an app that mounts a
   * `Channel` for each edit, so it knows when to remove it.
   */
  onClose?: () => void;
  /**
   * Starts editing this message when the component mounts. For a list outside the message's
   * `Channel`, e.g. one across channels; a channel's own list starts edits itself.
   */
  scheduledMessage?: ScheduledMessageResponse;
};

/**
 * Shows the composer while a scheduled message is being edited, and nothing otherwise. Render it
 * inside the `Channel` the message belongs to. The edit starts with `editScheduledMessage` from
 * `useMessageComposerAPIContext`, or from `scheduledMessage`. Saving or cancelling ends it.
 *
 * The composer's notifications go to the channel's notification host, so the screen should show a
 * `NotificationList` for it, as a channel screen does.
 */
export const ScheduledMessageEditComposer = ({
  onClose,
  scheduledMessage,
}: ScheduledMessageEditComposerProps) => {
  const { editScheduledMessage } = useMessageComposerAPIContext();
  const { inputBoxRef } = useMessageInputContext();
  const { editedScheduledMessage } = useEditedScheduledMessage();
  const editedId = editedScheduledMessage?.id;
  // Kept here rather than in the save button, so the sheet outlives the edit and slides closed.
  const [rescheduleRequest, setRescheduleRequest] = useState<RescheduleSheetRequest>();

  // Nothing is being edited and no Reschedule sheet is still closing over the edit.
  const closeIfDone = useStableCallback(() => {
    if (!editedId && !rescheduleRequest) onClose?.();
  });

  const closeRescheduleSheet = useStableCallback(() => {
    setRescheduleRequest(undefined);
    if (!editedId) onClose?.();
  });

  const startEdit = useStableCallback(() => {
    if (scheduledMessage) editScheduledMessage(scheduledMessage);
  });

  useEffect(() => {
    startEdit();
  }, [scheduledMessage?.id, startEdit]);

  // Opens the keyboard when an edit starts, as editing a sent message does, and closes it when the
  // edit ends. Unmounting leaves `editedId` as it was, so it doesn't count as an end.
  useEffect(() => {
    if (!editedId) return;
    inputBoxRef.current?.focus();
    return () => {
      Keyboard.dismiss();
      closeIfDone();
    };
  }, [closeIfDone, editedId, inputBoxRef]);

  return (
    <RescheduleSheetContext.Provider value={setRescheduleRequest}>
      {editedScheduledMessage ? <MessageComposer /> : null}
      <RescheduleSheet onClose={closeRescheduleSheet} request={rescheduleRequest} />
    </RescheduleSheetContext.Provider>
  );
};
