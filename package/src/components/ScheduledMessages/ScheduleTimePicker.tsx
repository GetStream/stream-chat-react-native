import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { useScheduledTimeFormatter } from './hooks/useScheduledTimeFormatter';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { primitives } from '../../theme';

export type ScheduleTimePickerProps = {
  /** Called with `selectedDate` at the picked hour and minute. */
  onSelectTime: (date: Date) => void;
  selectedDate: Date;
  /** The earliest time the server accepts. Earlier hours and minutes are shown disabled. */
  minimumDate?: Date;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);
const COLUMN_HEIGHT = 168;
const ITEM_HEIGHT = 36;

const twoDigits = (value: number) => String(value).padStart(2, '0');

type TimeColumnItemProps = {
  disabled: boolean;
  isSelected: boolean;
  onSelect: (value: number) => void;
  testID: string;
  value: number;
};

const TimeColumnItem = ({ disabled, isSelected, onSelect, testID, value }: TimeColumnItemProps) => {
  const {
    theme: {
      scheduledMessages: { timePicker: timePickerTheme },
      semantics,
    },
  } = useTheme();
  const onPress = useStableCallback(() => onSelect(value));

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ disabled, selected: isSelected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.item,
        isSelected ? { backgroundColor: semantics.backgroundUtilitySelected } : null,
        timePickerTheme.item,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.itemText,
          { color: disabled ? semantics.textDisabled : semantics.textPrimary },
          isSelected ? styles.selectedItemText : null,
          timePickerTheme.itemText,
        ]}
      >
        {twoDigits(value)}
      </Text>
    </Pressable>
  );
};

const TimeColumn = ({
  isDisabled,
  items,
  onSelect,
  selected,
  testID,
}: {
  isDisabled: (value: number) => boolean;
  items: number[];
  onSelect: (value: number) => void;
  selected: number;
  testID: string;
}) => {
  const initialOffset = useRef(
    Math.max(0, selected * ITEM_HEIGHT - (COLUMN_HEIGHT - ITEM_HEIGHT) / 2),
  ).current;

  return (
    <View style={styles.column}>
      <ScrollView
        contentOffset={{ x: 0, y: initialOffset }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        testID={testID}
      >
        {items.map((item) => (
          <TimeColumnItem
            disabled={isDisabled(item)}
            isSelected={item === selected}
            key={item}
            onSelect={onSelect}
            testID={`${testID}-${item}`}
            value={item}
          />
        ))}
      </ScrollView>
    </View>
  );
};

/** The `Time` row of the schedule sheet. Tapping the time opens hour and minute lists. */
export const ScheduleTimePicker = ({
  minimumDate,
  onSelectTime,
  selectedDate,
}: ScheduleTimePickerProps) => {
  const { t } = useTranslationContext();
  const { formatTime } = useScheduledTimeFormatter();
  const {
    theme: {
      scheduledMessages: { timePicker: timePickerTheme },
      semantics,
    },
  } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const atTime = useStableCallback((hours: number, minutes: number) => {
    const next = new Date(selectedDate);
    next.setHours(hours, minutes, 0, 0);
    return next;
  });

  // An hour is too soon when even its last minute is; a minute when that time itself is.
  const isHourDisabled = useStableCallback(
    (hours: number) => !!minimumDate && atTime(hours, 59) < minimumDate,
  );
  const isMinuteDisabled = useStableCallback(
    (minutes: number) => !!minimumDate && atTime(selectedDate.getHours(), minutes) < minimumDate,
  );

  const selectHours = useStableCallback((hours: number) =>
    onSelectTime(atTime(hours, selectedDate.getMinutes())),
  );
  const selectMinutes = useStableCallback((minutes: number) =>
    onSelectTime(atTime(selectedDate.getHours(), minutes)),
  );
  const toggleOpen = useStableCallback(() => setIsOpen((open) => !open));

  return (
    <View style={timePickerTheme.container}>
      <View style={[styles.row, timePickerTheme.row]}>
        <Text style={[styles.label, { color: semantics.textPrimary }, timePickerTheme.label]}>
          {t('scheduledMessages.time.label', 'Time')}
        </Text>
        <Pressable
          accessibilityRole='button'
          accessibilityState={{ expanded: isOpen }}
          onPress={toggleOpen}
          style={[
            styles.pill,
            { backgroundColor: semantics.backgroundCoreSurfaceDefault },
            timePickerTheme.pill,
          ]}
          testID='schedule-time-pill'
        >
          <Text
            style={[
              styles.pillText,
              { color: isOpen ? semantics.accentPrimary : semantics.textPrimary },
              timePickerTheme.pillText,
            ]}
          >
            {formatTime(selectedDate)}
          </Text>
        </Pressable>
      </View>
      {isOpen ? (
        <View style={[styles.columns, timePickerTheme.columns]}>
          <TimeColumn
            isDisabled={isHourDisabled}
            items={HOURS}
            onSelect={selectHours}
            selected={selectedDate.getHours()}
            testID='schedule-time-hours'
          />
          <Text style={[styles.separator, { color: semantics.textPrimary }]}>:</Text>
          <TimeColumn
            isDisabled={isMinuteDisabled}
            items={MINUTES}
            onSelect={selectMinutes}
            selected={selectedDate.getMinutes()}
            testID='schedule-time-minutes'
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    height: COLUMN_HEIGHT,
    width: 72,
  },
  columns: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingXs,
    justifyContent: 'center',
    paddingVertical: primitives.spacingXs,
  },
  item: {
    alignItems: 'center',
    borderRadius: primitives.radiusMd,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: primitives.typographyFontSizeLg,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: primitives.typographyFontWeightRegular,
  },
  pill: {
    borderRadius: primitives.radiusMax,
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingXs,
  },
  pillText: {
    fontSize: primitives.typographyFontSizeMd,
    fontVariant: ['tabular-nums'],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  selectedItemText: {
    fontWeight: primitives.typographyFontWeightSemiBold,
  },
  separator: {
    fontSize: primitives.typographyFontSizeLg,
    fontWeight: primitives.typographyFontWeightSemiBold,
  },
});
