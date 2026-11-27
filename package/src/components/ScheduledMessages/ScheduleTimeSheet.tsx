import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { Channel, LocalMessage } from 'stream-chat';
import { ScheduledMessageBlockReason } from 'stream-chat';

import { useChannelScheduledMessageLimit } from './hooks/useChannelScheduledMessageLimit';
import type { ScheduleComposerMessageResult } from './hooks/useScheduleComposerMessage';
import { formatWithParser, useScheduledTimeFormatter } from './hooks/useScheduledTimeFormatter';
import { ScheduleSheetHeader } from './ScheduleSheetHeader';
import { ScheduleSheetNotice } from './ScheduleSheetNotice';
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
import type { IconProps } from '../../icons/utils/base';
import { NativeHandlers, type PickDateTimeOptions } from '../../native';
import { components, primitives } from '../../theme';
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

type ScheduleTimeRowProps = {
  disabled: boolean;
  Icon: React.ComponentType<IconProps>;
  label: string;
  onPress: () => void;
  testID: string;
  value: string;
};

/** A `Date` or `Time` row, with the label on the left and the selected value on the right. */
const ScheduleTimeRow = ({
  disabled,
  Icon,
  label,
  onPress,
  testID,
  value,
}: ScheduleTimeRowProps) => {
  const {
    theme: {
      scheduledMessages: { timeSheet },
      semantics,
    },
  } = useTheme();

  const style = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.row,
      pressed ? { backgroundColor: semantics.backgroundUtilityPressed } : null,
      timeSheet.row,
    ],
    [semantics.backgroundUtilityPressed, timeSheet.row],
  );

  return (
    <Pressable
      accessibilityLabel={`${label}, ${value}`}
      accessibilityRole='button'
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      <Icon
        height={components.iconSizeMd}
        stroke={semantics.textSecondary}
        width={components.iconSizeMd}
      />
      <Text
        numberOfLines={1}
        style={[styles.rowLabel, { color: semantics.textPrimary }, timeSheet.rowLabel]}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.rowValue, { color: semantics.textTertiary }, timeSheet.rowValue]}
      >
        {value}
      </Text>
    </Pressable>
  );
};

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
  const { icons, Reply } = useComponentsContext();
  // Read without throwing, as a list across channels reschedules outside any `Channel`.
  const { messageComposer } = useContext(
    MessageComposerContext,
  ) as Partial<MessageComposerContextValue>;
  const { t, tDateTimeParser } = useTranslationContext();
  const { formatTime } = useScheduledTimeFormatter();
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

  const pickDateTime = NativeHandlers.pickDateTime;
  const isPickingRef = useRef(false);
  // Aborted on unmount, so a picker that is still open closes together with the sheet.
  const pickerAbortRef = useRef<AbortController>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    pickerAbortRef.current = controller;
    return () => controller.abort();
  }, []);

  const pick = (mode: PickDateTimeOptions['mode'], value: Date) =>
    pickDateTime
      ? pickDateTime({
          cancelLabel: t('common.cancel.label', 'Cancel'),
          confirmLabel: t('scheduledMessages.pickerConfirm.label', 'Confirm'),
          maximumDate: bounds.latest,
          minimumDate: bounds.earliest,
          mode,
          signal: pickerAbortRef.current?.signal,
          value,
        }).catch(() => null)
      : Promise.resolve(null);

  // Presses are ignored while a picker is open or being opened.
  const runPicker = async (picker: () => Promise<void>) => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    try {
      await picker();
    } finally {
      isPickingRef.current = false;
    }
  };

  // Confirming a date opens the time picker next, as the design specifies for both platforms.
  const pickDate = useStableCallback(() =>
    runPicker(async () => {
      const date = await pick('date', scheduledAt);
      if (!date) return;
      changeTime(date);
      const time = await pick('time', date);
      if (time) changeTime(time);
    }),
  );

  const pickTime = useStableCallback(() =>
    runPicker(async () => {
      const time = await pick('time', scheduledAt);
      if (time) changeTime(time);
    }),
  );

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
        <View style={[styles.rows, timeSheet.rows]}>
          <ScheduleTimeRow
            disabled={!pickDateTime}
            Icon={icons.Calendar}
            label={t('scheduledMessages.date.label', 'Date')}
            onPress={pickDate}
            testID='schedule-time-sheet-date'
            value={formatWithParser(tDateTimeParser, scheduledAt, 'ddd, MMM D')}
          />
          <ScheduleTimeRow
            disabled={!pickDateTime}
            Icon={icons.Time}
            label={t('scheduledMessages.time.label', 'Time')}
            onPress={pickTime}
            testID='schedule-time-sheet-time'
            value={formatTime(scheduledAt)}
          />
        </View>
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
    gap: primitives.spacingMd,
    paddingHorizontal: primitives.spacingMd,
    paddingTop: primitives.spacingXs,
  },
  row: {
    alignItems: 'center',
    borderRadius: primitives.radiusMd,
    flexDirection: 'row',
    gap: primitives.spacingSm,
    minHeight: 48,
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingXs,
  },
  rowLabel: {
    flex: 1,
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  // List items extend beyond the horizontal padding of the surrounding content.
  rows: {
    marginHorizontal: primitives.spacingXxs - primitives.spacingMd,
  },
  rowValue: {
    fontSize: primitives.typographyFontSizeSm,
    lineHeight: primitives.typographyLineHeightNormal,
    width: 120,
  },
});
