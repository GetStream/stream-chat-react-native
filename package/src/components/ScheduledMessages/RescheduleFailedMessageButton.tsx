import React, { useState } from 'react';

import { nsToDate } from 'stream-chat';

import { useEditedScheduledMessage } from './hooks/useEditedScheduledMessage';
import {
  RescheduleSheet,
  type RescheduleSheetRequest,
  useOpenRescheduleSheet,
} from './RescheduleSheetHost';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStableCallback } from '../../hooks/useStableCallback';
import { EditButton } from '../MessageInput/components/OutputButtons/EditButton';

export type RescheduleFailedMessageButtonProps = {
  disabled: boolean;
};

/**
 * The save button while the composer edits a failed scheduled message. Saving schedules it again
 * as a new message, so it opens the date and time sheet first.
 */
export const RescheduleFailedMessageButton = ({ disabled }: RescheduleFailedMessageButtonProps) => {
  const messageComposer = useMessageComposer();
  const { editedScheduledMessage } = useEditedScheduledMessage();
  const openHostedSheet = useOpenRescheduleSheet();
  const [request, setRequest] = useState<RescheduleSheetRequest>();

  const open = useStableCallback(async () => {
    // nothing is returned when the composer can't send yet, i.e while an upload is running.
    const composition = await messageComposer.compose();
    if (!composition) return;
    const nextRequest = {
      initialDate: editedScheduledMessage
        ? nsToDate(editedScheduledMessage.scheduled_at)
        : undefined,
      message: composition.localMessage,
    };
    (openHostedSheet ?? setRequest)(nextRequest);
  });

  const close = useStableCallback(() => setRequest(undefined));

  return (
    <>
      <EditButton disabled={disabled} sendMessage={open} />
      {openHostedSheet ? null : <RescheduleSheet onClose={close} request={request} />}
    </>
  );
};
