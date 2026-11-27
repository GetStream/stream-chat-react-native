import React, { useEffect } from 'react';
import { Keyboard } from 'react-native';

import { useEditedScheduledMessage } from './hooks/useEditedScheduledMessage';
import { RescheduleSheetHost } from './RescheduleSheetHost';

import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { MessageComposer } from '../MessageInput/MessageComposer';

/**
 * Shows the composer while a scheduled message is being edited, and nothing otherwise. Start the
 * edit with `editScheduledMessage` from `useMessageComposerAPIContext`, inside the `Channel` the
 * message belongs to. Saving or cancelling ends it.
 *
 * The composer's notifications go to the channel's notification host, so the screen should show a
 * `NotificationList` for it, as a channel screen does.
 */
export const ScheduledMessageEditComposer = () => {
  const { inputBoxRef } = useMessageInputContext();
  const { editedScheduledMessage } = useEditedScheduledMessage();
  const editedId = editedScheduledMessage?.id;

  // Opens the keyboard when an edit starts, as editing a sent message does, and closes it when the
  // edit ends.
  useEffect(() => {
    if (!editedId) return;
    inputBoxRef.current?.focus();
    return () => Keyboard.dismiss();
  }, [editedId, inputBoxRef]);

  // The host stays when the edit ends, so rescheduling a failed message can slide its sheet closed.
  return (
    <RescheduleSheetHost>{editedScheduledMessage ? <MessageComposer /> : null}</RescheduleSheetHost>
  );
};
