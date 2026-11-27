import React, { useCallback, useMemo, useState } from 'react';
import {
  I18nManager,
  Pressable,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { LocalMessage } from 'stream-chat';

import { useChannelScheduledMessageLimit } from './hooks/useChannelScheduledMessageLimit';
import { useScheduleComposerMessage } from './hooks/useScheduleComposerMessage';

import { ScheduleSheetHeader } from './ScheduleSheetHeader';

import { formatSchedulePreset } from './utils/scheduledTimeLabels';
import { getAvailableSchedulePresets, getScheduleTimeBounds } from './utils/scheduleTime';

import { useBottomSheetContext } from '../../contexts/bottomSheetContext/BottomSheetContext';
import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  type ScheduleSheetState,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useStateStore } from '../../hooks/useStateStore';
import { components, primitives } from '../../theme';
import { BottomSheetModal } from '../UIComponents/BottomSheetModal';

const scheduleSheetSelector = ({ isOpen }: ScheduleSheetState) => ({ isOpen });

type ScheduleOptionProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
  testID: string;
  showChevron?: boolean;
};

const ScheduleOption = ({ disabled, label, onPress, showChevron, testID }: ScheduleOptionProps) => {
  const { icons } = useComponentsContext();
  const {
    theme: {
      scheduledMessages: { presetSheet },
      semantics,
    },
  } = useTheme();
  const color = disabled ? semantics.textDisabled : semantics.textPrimary;
  const iconColor = disabled ? semantics.textDisabled : semantics.textSecondary;
  const Chevron = I18nManager.isRTL ? icons.ChevronLeft : icons.ChevronRight;

  const style = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.option,
      pressed ? { backgroundColor: semantics.backgroundUtilityPressed } : null,
      presetSheet.option,
    ],
    [presetSheet.option, semantics.backgroundUtilityPressed],
  );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole='button'
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      <icons.Time height={components.iconSizeMd} stroke={iconColor} width={components.iconSizeMd} />
      <Text numberOfLines={1} style={[styles.optionLabel, { color }, presetSheet.optionLabel]}>
        {label}
      </Text>
      {showChevron ? (
        <Chevron height={components.iconSizeMd} stroke={iconColor} width={components.iconSizeMd} />
      ) : null}
    </Pressable>
  );
};

type PresetOptionProps = {
  disabled: boolean;
  label: string;
  onSelect: (preset: Date) => void;
  preset: Date;
};

const PresetOption = ({ disabled, label, onSelect, preset }: PresetOptionProps) => {
  const onPress = useStableCallback(() => onSelect(preset));

  return (
    <ScheduleOption
      disabled={disabled}
      label={label}
      onPress={onPress}
      testID={`schedule-preset-${preset.getTime()}`}
    />
  );
};

/** `Custom time`, which opens the date and time sheet on top of the quick times. */
const CustomTimeOption = ({ disabled }: { disabled: boolean }) => {
  const { close } = useBottomSheetContext();
  const { ScheduleTimeSheet } = useComponentsContext();
  const { channel } = useChannelContext();
  const messageComposer = useMessageComposer();
  const { t } = useTranslationContext();
  const schedule = useScheduleComposerMessage();
  const [customTimePreviewMessage, setCustomTimePreviewMessage] = useState<LocalMessage>();

  const open = useStableCallback(async () => {
    // Nothing is returned when the composer can't send yet, e.g. while an upload is running.
    const composition = await messageComposer.compose();
    if (composition) setCustomTimePreviewMessage(composition.localMessage);
  });

  const closeCustomTime = useStableCallback(() => setCustomTimePreviewMessage(undefined));

  const confirmCustomTime = useStableCallback(async (scheduledAt: Date) => {
    const result = await schedule(scheduledAt, { fromTimeSheet: true });
    // Scheduled, so the quick times close along with this sheet.
    if (!result.errorText) close();
    return result;
  });

  return (
    <>
      <ScheduleOption
        disabled={disabled}
        label={t('scheduledMessages.customTime.label', 'Custom time')}
        onPress={open}
        showChevron
        testID='schedule-custom-time'
      />
      <ScheduleTimeSheet
        channel={channel}
        message={customTimePreviewMessage}
        onClose={closeCustomTime}
        onConfirm={confirmCustomTime}
        visible={!!customTimePreviewMessage}
      />
    </>
  );
};

const ScheduleMessageSheetContent = () => {
  const { close } = useBottomSheetContext();
  const { channel } = useChannelContext();
  const { isLimitReached, maxPerChannel } = useChannelScheduledMessageLimit(channel);
  const schedule = useScheduleComposerMessage();
  const { t, tDateTimeParser } = useTranslationContext();
  const {
    theme: {
      scheduledMessages: { presetSheet },
    },
  } = useTheme();

  // The presets are worked out when the sheet opens, in the device's time zone.
  const { now, presets } = useMemo(() => {
    const openedAt = new Date();
    return {
      now: openedAt,
      presets: getAvailableSchedulePresets(openedAt, getScheduleTimeBounds(channel, openedAt)),
    };
  }, [channel]);

  const closeSheet = useStableCallback(() => close());

  const selectPreset = useStableCallback((preset: Date) => {
    schedule(preset).catch(() => undefined);
    close();
  });

  // A failed message comes back as a new one, so it counts against the limit like any other.
  const title = isLimitReached
    ? t('scheduledMessages.limitReached.title', 'Limit reached ({{ count }} max)', {
        count: maxPerChannel,
      })
    : t('scheduledMessages.scheduleMessage.title', 'Schedule message');

  return (
    <View style={[styles.container, presetSheet.container]} testID='schedule-message-sheet'>
      <ScheduleSheetHeader onClose={closeSheet} title={title} />
      <View style={[styles.options, presetSheet.options]}>
        {presets.map((preset) => (
          <PresetOption
            disabled={isLimitReached}
            key={preset.getTime()}
            label={formatSchedulePreset(preset, now, { t, tDateTimeParser })}
            onSelect={selectPreset}
            preset={preset}
          />
        ))}
        <CustomTimeOption disabled={isLimitReached} />
      </View>
    </View>
  );
};

/** The sheet a long press on the send button opens: quick times and `Custom time`. */
export const ScheduleMessageSheet = () => {
  const { closeScheduleSheet, scheduleSheetStore } = useMessageInputContext();
  const { isOpen } = useStateStore(scheduleSheetStore, scheduleSheetSelector);

  return (
    <BottomSheetModal enableDynamicSizing onClose={closeScheduleSheet} visible={isOpen}>
      <ScheduleMessageSheetContent />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: primitives.spacingMd,
  },
  option: {
    alignItems: 'center',
    borderRadius: primitives.radiusMd,
    flexDirection: 'row',
    gap: primitives.spacingSm,
    minHeight: 48,
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingXs,
  },
  optionLabel: {
    flex: 1,
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  options: {
    paddingHorizontal: primitives.spacingXxs,
  },
});
