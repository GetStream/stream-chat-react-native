import React, { useState } from 'react';

import type { LocalMessage } from 'stream-chat';
import { nsToDate } from 'stream-chat';

import { useEditedScheduledMessage } from './hooks/useEditedScheduledMessage';
import { useScheduleComposerMessage } from './hooks/useScheduleComposerMessage';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
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
  const { ScheduleTimeSheet } = useComponentsContext();
  const { channel } = useChannelContext();
  const messageComposer = useMessageComposer();
  const { editedScheduledMessage } = useEditedScheduledMessage();
  const { t } = useTranslationContext();
  const schedule = useScheduleComposerMessage();
  const [previewMessage, setPreviewMessage] = useState<LocalMessage>();

  const open = useStableCallback(async () => {
    // nothing is returned when the composer can't send yet, i.e while an upload is running.
    const composition = await messageComposer.compose();
    if (composition) setPreviewMessage(composition.localMessage);
  });

  const close = useStableCallback(() => setPreviewMessage(undefined));

  const confirm = useStableCallback((scheduledAt: Date) =>
    schedule(scheduledAt, { fromTimeSheet: true }),
  );

  return (
    <>
      <EditButton disabled={disabled} sendMessage={open} />
      <ScheduleTimeSheet
        channel={channel}
        initialDate={
          editedScheduledMessage ? nsToDate(editedScheduledMessage.scheduled_at) : undefined
        }
        message={previewMessage}
        onClose={close}
        onConfirm={confirm}
        title={t('scheduledMessages.rescheduleMessage.title', 'Reschedule message')}
        visible={!!previewMessage}
      />
    </>
  );
};
