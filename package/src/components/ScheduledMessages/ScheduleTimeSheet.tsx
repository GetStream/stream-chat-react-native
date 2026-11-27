import React, { useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { Channel, LocalMessage } from 'stream-chat';
import { ScheduledMessageBlockReason } from 'stream-chat';

import { useChannelScheduledMessageLimit } from './hooks/useChannelScheduledMessageLimit';
import type { ScheduleComposerMessageResult } from './hooks/useScheduleComposerMessage';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleSheetHeader } from './ScheduleSheetHeader';
import { ScheduleSheetNotice } from './ScheduleSheetNotice';
import { ScheduleTimePicker } from './ScheduleTimePicker';
import {
  formatTimeZoneOffset,
  getDefaultScheduledAt,
  getScheduleTimeBounds,
  getScheduleTimeError,
} from './utils/scheduleTime';

import { useBottomSheetContext } from '../../contexts/bottomSheetContext/BottomSheetContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import {
  MessageComposerContext,
  type MessageComposerContextValue,
} from '../../contexts/messageComposerContext/MessageComposerContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { primitives } from '../../theme';
import { useChannelPreviewDisplayName } from '../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { BottomSheetModal } from '../UIComponents/BottomSheetModal';

export type ScheduleTimeSheetProps = {
  channel: Channel;
  /** The message being scheduled, shown in the preview card. */
  message?: LocalMessage;
  /** Called with the picked time. Resolves with the error to show, or nothing on success. */
  onConfirm: (scheduledAt: Date) => Promise<ScheduleComposerMessageResult>;
  onClose: () => void;
  visible: boolean;
  /** The time the sheet opens with. Defaults to tomorrow at 09:00. */
  initialDate?: Date;
  /** Replaces the sheet's title, e.g. `Reschedule message`. */
  title?: string;
  /** Replaces the preview card's first line, e.g. `Scheduled for Fri, Oct 23 at 09:00`. */
  previewTitle?: string;
  /**
   * `reschedule` moves a scheduled message to another time. That adds no message, so the count
   * note is left out, and the server never sends it right away, so a too-soon time says so.
   */
  mode?: 'schedule' | 'reschedule';
};

const NOW_REFRESH_INTERVAL_MS = 15_000;

const ScheduleTimeSheetContent = ({
  channel,
  initialDate,
  message,
  mode = 'schedule',
  onConfirm,
  previewTitle: previewTitleProp,
  title: titleProp,
}: Omit<ScheduleTimeSheetProps, 'onClose' | 'visible'>) => {
  const { close } = useBottomSheetContext();
  const { Reply } = useComponentsContext();
  // Read without throwing, as a list across channels reschedules outside any `Channel`.
  const { messageComposer } = useContext(
    MessageComposerContext,
  ) as Partial<MessageComposerContextValue>;
  const { t } = useTranslationContext();
  const channelName = useChannelPreviewDisplayName(channel)?.trim();
  const { maxPerChannel, pendingCount } = useChannelScheduledMessageLimit(channel);

  const title = titleProp ?? t('scheduledMessages.scheduleMessage.title', 'Schedule message');

  const quotedName = message?.quoted_message?.user?.name;
  const previewTitle =
    previewTitleProp ??
    (quotedName
      ? t('reply.replyTo.title', 'Reply to {{name}}', { name: quotedName })
      : channelName
        ? t('scheduledMessages.messageTo.title', 'Message to {{ name }}', { name: channelName })
        : t('scheduledMessages.message.title', 'Scheduled message'));

  const usageText =
    mode === 'schedule' && maxPerChannel !== undefined && pendingCount > 0
      ? t('scheduledMessages.usage.text', '{{ count }} of {{ max }} scheduled in this channel', {
          count: pendingCount,
          max: maxPerChannel,
        })
      : undefined;
  const {
    theme: {
      scheduledMessages: { timeSheet },
      semantics,
    },
  } = useTheme();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), NOW_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const bounds = useMemo(() => getScheduleTimeBounds(channel, now), [channel, now]);
  const [scheduledAt, setScheduledAt] = useState(
    () => initialDate ?? getDefaultScheduledAt(new Date(), bounds),
  );
  const [submitError, setSubmitError] = useState<string>();
  // Set once the server refuses for the per-user limit. Any other time would be refused the same
  // way, so it keeps confirm disabled and stays when the time changes.
  const [userLimitError, setUserLimitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const blockedText =
    mode === 'schedule' &&
    messageComposer?.scheduleBlockReason === ScheduledMessageBlockReason.Command
      ? t(
          'scheduledMessages.commandBlocked.error',
          "Commands can't be scheduled. Remove the / command to continue.",
        )
      : userLimitError;

  const timeError = getScheduleTimeError(scheduledAt, bounds);
  const timeErrorText =
    timeError === 'too_soon'
      ? mode === 'reschedule'
        ? t(
            'scheduledMessages.rescheduleTooSoon.error',
            "Pick a later time. Editing can't send a message right away.",
          )
        : t('scheduledMessages.tooSoon.error', 'Pick a time at least 1 minute from now')
      : timeError === 'too_far'
        ? t('scheduledMessages.tooFar.error', "That's further ahead than your app allows")
        : undefined;

  const errorText = blockedText ?? timeErrorText ?? submitError;
  const confirmDisabled = isSubmitting || !!blockedText || !!timeError;

  const changeTime = useStableCallback((next: Date) => {
    setSubmitError(undefined);
    setScheduledAt(next);
  });

  const closeSheet = useStableCallback(() => close());

  const confirm = useStableCallback(async () => {
    if (confirmDisabled) return;
    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      const { errorText: error, isUserLimit } = await onConfirm(scheduledAt);
      if (isUserLimit) {
        setUserLimitError(error);
      } else if (error) {
        setSubmitError(error);
      } else {
        close();
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <View style={[styles.container, timeSheet.container]} testID='schedule-time-sheet'>
      <ScheduleSheetHeader
        confirmDisabled={confirmDisabled}
        onClose={closeSheet}
        onConfirm={confirm}
        title={title}
      />
      <View style={[styles.content, timeSheet.content]}>
        {message ? <Reply mode='reply' quotedMessage={message} title={previewTitle} /> : null}
        {errorText ? <ScheduleSheetNotice title={errorText} type='error' /> : null}
        <View style={[styles.divider, { backgroundColor: semantics.borderCoreSubtle }]} />
        <ScheduleCalendar
          minimumDate={bounds.earliest}
          onSelectDate={changeTime}
          selectedDate={scheduledAt}
        />
        <View style={[styles.divider, { backgroundColor: semantics.borderCoreSubtle }]} />
        <ScheduleTimePicker
          minimumDate={bounds.earliest}
          onSelectTime={changeTime}
          selectedDate={scheduledAt}
        />
        <ScheduleSheetNotice
          description={
            usageText
              ? t('scheduledMessages.timeZone.text', 'Sent in your time zone ({{ timeZone }})', {
                  timeZone: formatTimeZoneOffset(scheduledAt),
                })
              : undefined
          }
          title={
            usageText ??
            t('scheduledMessages.timeZone.text', 'Sent in your time zone ({{ timeZone }})', {
              timeZone: formatTimeZoneOffset(scheduledAt),
            })
          }
          type='info'
        />
      </View>
    </View>
  );
};

/** The date and time sheet for `Custom time`, rescheduling, and saving a failed message. */
export const ScheduleTimeSheet = ({ onClose, visible, ...props }: ScheduleTimeSheetProps) => {
  const { height } = useWindowDimensions();

  return (
    <BottomSheetModal enableDynamicSizing height={height} onClose={onClose} visible={visible}>
      <ScheduleTimeSheetContent {...props} />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: primitives.spacingMd,
  },
  content: {
    gap: primitives.spacingSm,
    paddingHorizontal: primitives.spacingMd,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
