import React, { useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatWithParser } from './hooks/useScheduledTimeFormatter';

import { isSameLocalDay } from './utils/scheduleTime';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { primitives } from '../../theme';

export type ScheduleCalendarProps = {
  /** The first selectable day. Earlier days are shown disabled. */
  minimumDate: Date;
  /** Called with the tapped day, keeping the time of `selectedDate`. */
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
};

const DAYS_IN_WEEK = 7;

/** The days of a month, a week to a row, starting on Sunday. Empty cells are `undefined`. */
export const getCalendarWeeks = (year: number, month: number) => {
  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | undefined)[] = [
    ...Array.from({ length: leadingBlanks }, () => undefined),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % DAYS_IN_WEEK) cells.push(undefined);

  return Array.from({ length: cells.length / DAYS_IN_WEEK }, (_, week) =>
    cells.slice(week * DAYS_IN_WEEK, (week + 1) * DAYS_IN_WEEK),
  );
};

const startOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

type CalendarDayProps = {
  accessibilityLabel: string;
  dayOfMonth: number;
  isPast: boolean;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (dayOfMonth: number) => void;
};

const CalendarDay = ({
  accessibilityLabel,
  dayOfMonth,
  isPast,
  isSelected,
  isToday,
  onSelect,
}: CalendarDayProps) => {
  const {
    theme: {
      scheduledMessages: { calendar: calendarTheme },
      semantics,
    },
  } = useTheme();
  const onPress = useStableCallback(() => onSelect(dayOfMonth));

  const backgroundColor = isSelected
    ? isToday
      ? semantics.accentPrimary
      : semantics.backgroundCoreInverse
    : isToday
      ? semantics.accentPrimarySubtle
      : undefined;
  const color = isSelected
    ? isToday
      ? semantics.textOnAccent
      : semantics.textOnInverse
    : isToday
      ? semantics.accentPrimary
      : isPast
        ? semantics.textDisabled
        : semantics.textPrimary;

  return (
    <View style={styles.dayCell}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole='button'
        accessibilityState={{ disabled: isPast, selected: isSelected }}
        disabled={isPast}
        onPress={onPress}
        style={[
          styles.day,
          backgroundColor ? { backgroundColor } : null,
          calendarTheme.day,
          isSelected ? calendarTheme.selectedDay : null,
        ]}
        testID={`schedule-calendar-day-${dayOfMonth}`}
      >
        <Text
          style={[
            styles.dayText,
            { color },
            isSelected ? styles.selectedDayText : null,
            calendarTheme.dayText,
          ]}
        >
          {dayOfMonth}
        </Text>
      </Pressable>
    </View>
  );
};

export const ScheduleCalendar = ({
  minimumDate,
  onSelectDate,
  selectedDate,
}: ScheduleCalendarProps) => {
  const { icons } = useComponentsContext();
  const { tDateTimeParser } = useTranslationContext();
  const {
    theme: {
      scheduledMessages: { calendar: calendarTheme },
      semantics,
    },
  } = useTheme();

  const [shownMonth, setShownMonth] = useState(() => ({
    month: selectedDate.getMonth(),
    year: selectedDate.getFullYear(),
  }));

  const weeks = useMemo(
    () => getCalendarWeeks(shownMonth.year, shownMonth.month),
    [shownMonth.month, shownMonth.year],
  );

  const weekdayNames = useMemo(() => {
    // Any Sunday works as the start of the week; 2023-01-01 was one.
    const sunday = new Date(2023, 0, 1);
    return Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + index);
      return formatWithParser(tDateTimeParser, day, 'ddd').toUpperCase();
    });
  }, [tDateTimeParser]);

  const monthTitle = formatWithParser(
    tDateTimeParser,
    new Date(shownMonth.year, shownMonth.month, 1),
    'MMMM YYYY',
  );

  const firstSelectableDay = startOfDay(minimumDate);
  const canGoBack =
    new Date(shownMonth.year, shownMonth.month, 1) >
    new Date(firstSelectableDay.getFullYear(), firstSelectableDay.getMonth(), 1);
  const today = new Date();

  const moveMonth = useStableCallback((delta: number) =>
    setShownMonth(({ month, year }) => {
      const next = new Date(year, month + delta, 1);
      return { month: next.getMonth(), year: next.getFullYear() };
    }),
  );
  const showPreviousMonth = useStableCallback(() => moveMonth(-1));
  const showNextMonth = useStableCallback(() => moveMonth(1));

  const selectDay = useStableCallback((dayOfMonth: number) => {
    const next = new Date(selectedDate);
    next.setFullYear(shownMonth.year, shownMonth.month, dayOfMonth);
    onSelectDate(next);
  });

  const PreviousIcon = I18nManager.isRTL ? icons.ChevronRight : icons.ChevronLeft;
  const NextIcon = I18nManager.isRTL ? icons.ChevronLeft : icons.ChevronRight;

  return (
    <View style={[styles.container, calendarTheme.container]} testID='schedule-calendar'>
      <View style={[styles.header, calendarTheme.header]}>
        <Text
          accessibilityRole='header'
          style={[styles.monthTitle, { color: semantics.textPrimary }, calendarTheme.monthTitle]}
        >
          {monthTitle}
        </Text>
        <View style={styles.navigation}>
          <Pressable
            accessibilityRole='button'
            accessibilityState={{ disabled: !canGoBack }}
            disabled={!canGoBack}
            hitSlop={8}
            onPress={showPreviousMonth}
            testID='schedule-calendar-previous-month'
          >
            <PreviousIcon
              height={20}
              stroke={canGoBack ? semantics.textPrimary : semantics.textDisabled}
              width={20}
            />
          </Pressable>
          <Pressable
            accessibilityRole='button'
            hitSlop={8}
            onPress={showNextMonth}
            testID='schedule-calendar-next-month'
          >
            <NextIcon height={20} stroke={semantics.textPrimary} width={20} />
          </Pressable>
        </View>
      </View>
      <View style={styles.week}>
        {weekdayNames.map((name) => (
          <Text
            key={name}
            style={[styles.weekday, { color: semantics.textTertiary }, calendarTheme.weekday]}
          >
            {name}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((dayOfMonth, dayIndex) => {
            if (!dayOfMonth) return <View key={dayIndex} style={styles.dayCell} />;

            const day = new Date(shownMonth.year, shownMonth.month, dayOfMonth);

            return (
              <CalendarDay
                accessibilityLabel={formatWithParser(tDateTimeParser, day, 'LL')}
                dayOfMonth={dayOfMonth}
                isPast={day < firstSelectableDay}
                isSelected={isSameLocalDay(day, selectedDate)}
                isToday={isSameLocalDay(day, today)}
                key={dayIndex}
                onSelect={selectDay}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const DAY_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    gap: primitives.spacingXxs,
  },
  day: {
    alignItems: 'center',
    borderRadius: DAY_SIZE / 2,
    height: DAY_SIZE,
    justifyContent: 'center',
    width: DAY_SIZE,
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: primitives.spacingXxs,
  },
  dayText: {
    fontSize: primitives.typographyFontSizeLg,
    fontWeight: primitives.typographyFontWeightRegular,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: primitives.spacingXs,
    paddingHorizontal: primitives.spacingXs,
  },
  monthTitle: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: primitives.typographyFontWeightSemiBold,
  },
  navigation: {
    flexDirection: 'row',
    gap: primitives.spacingLg,
  },
  selectedDayText: {
    fontWeight: primitives.typographyFontWeightSemiBold,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightSemiBold,
    textAlign: 'center',
  },
});
