import React, { createContext, useContext } from 'react';

import type { LocalMessage } from 'stream-chat';

import { useScheduleComposerMessage } from './hooks/useScheduleComposerMessage';
import { useScheduledTimeFormatter } from './hooks/useScheduledTimeFormatter';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks/useStableCallback';

/** What the Reschedule sheet shows, copied when it opens so it outlives the edit. */
export type RescheduleSheetRequest = {
  message: LocalMessage;
  initialDate?: Date;
};

type OpenRescheduleSheet = (request: RescheduleSheetRequest) => void;

/**
 * Lets the save button open a Reschedule sheet rendered next to the edit rather than inside it.
 * Scheduling a failed message again ends the edit, so a sheet inside the composer would vanish
 * instead of sliding closed.
 */
export const RescheduleSheetContext = createContext<OpenRescheduleSheet | undefined>(undefined);

/** Opens the hosted Reschedule sheet, or `undefined` when no host is around. */
export const useOpenRescheduleSheet = () => useContext(RescheduleSheetContext);

type RescheduleSheetProps = {
  onClose: () => void;
  request?: RescheduleSheetRequest;
};

/** The date and time sheet for saving a failed scheduled message, which schedules it again. */
export const RescheduleSheet = ({ onClose, request }: RescheduleSheetProps) => {
  const { ScheduleTimeSheet } = useComponentsContext();
  const { channel } = useChannelContext();
  const { t } = useTranslationContext();
  const { formatDateTime } = useScheduledTimeFormatter();
  const schedule = useScheduleComposerMessage();

  const confirm = useStableCallback((scheduledAt: Date) =>
    schedule(scheduledAt, { fromTimeSheet: true }),
  );

  return (
    <ScheduleTimeSheet
      channel={channel}
      initialDate={request?.initialDate}
      message={request?.message}
      onClose={onClose}
      onConfirm={confirm}
      previewTitle={
        request?.initialDate
          ? t('scheduledMessages.banner.single.text', 'Scheduled for {{ time }}', {
              time: formatDateTime(request.initialDate),
            })
          : undefined
      }
      title={t('scheduledMessages.rescheduleMessage.title', 'Reschedule message')}
      visible={!!request}
    />
  );
};
