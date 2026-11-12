// A2UI's DateTimeInput: the date, the time or both, picked in a sheet of the app's own views, so
// an app needs no native date picker. What the person picks is written at once; the sheet's Close
// puts it away.
import React, { useMemo, useRef } from 'react';
import {
  I18nManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { useAITranslation } from '../../ai-components/contexts';
import { primitives } from '../../ai-components/internal/tokens';
import type { ScrollViewRef } from '../../types/react-native-compat';
import { useReplyState } from '../useReplyState';

/** A moment as the field reads and writes it: its day, and its time when it has one. */
type Moment = {
  day?: { date: number; month: number; year: number };
  hours?: number;
  minutes?: number;
};

const two = (number: number) => String(number).padStart(2, '0');

// What the agent wrote, or the person picked: `yyyy-MM-dd`, `HH:mm`, or both with a `T` (or a
// space) between, seconds and an offset left out.
export const parseMoment = (text: string): Moment => {
  const match = /^(?:(\d{4})-(\d{2})-(\d{2}))?(?:[T ]?(\d{2}):(\d{2}))?/.exec(text.trim());
  if (!match) return {};
  const [, year, month, date, hours, minutes] = match;
  return {
    ...(year ? { day: { date: Number(date), month: Number(month) - 1, year: Number(year) } } : {}),
    ...(hours !== undefined ? { hours: Number(hours), minutes: Number(minutes) } : {}),
  };
};

/** The moment as A2UI writes it: `yyyy-MM-dd`, `HH:mm`, or `yyyy-MM-ddTHH:mm`. */
export const formatMoment = (
  moment: Moment,
  { enableDate, enableTime }: { enableDate: boolean; enableTime: boolean },
) => {
  const day =
    moment.day && `${moment.day.year}-${two(moment.day.month + 1)}-${two(moment.day.date)}`;
  const time =
    moment.hours !== undefined ? `${two(moment.hours)}:${two(moment.minutes ?? 0)}` : undefined;
  if (enableDate && enableTime) return day && time ? `${day}T${time}` : (day ?? '');
  if (enableTime) return time ?? '';
  return day ?? '';
};

const sameDay = (a: Moment['day'], b: Moment['day']) =>
  !!a && !!b && a.year === b.year && a.month === b.month && a.date === b.date;

const dayNumber = ({ date, month, year }: NonNullable<Moment['day']>) =>
  year * 10000 + month * 100 + date;

export type DateTimeInputViewProps = {
  enableDate: boolean;
  enableTime: boolean;
  /** The colors and look of the field and the sheet. */
  palette: {
    accent: string;
    border: string;
    error: string;
    onAccent: string;
    secondaryText: string;
    surface: string;
    text: string;
  };
  value: string;
  /** Whether a check found something wrong with it. */
  hasError?: boolean;
  inputStyle?: TextStyle;
  label?: string;
  max?: string;
  min?: string;
  onChange?: (value: string) => void;
};

// The days of a month as the calendar lays them out, a week to a row, from the locale's Monday.
const weeksOf = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | undefined)[] = [
    ...Array.from({ length: lead }, () => undefined),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(undefined);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, step) => step * 5);
const TIME_HEIGHT = 180;

/** One of the time's lists, opening on the value it holds. */
const TimeColumn = ({
  chosen,
  items,
  onChoose,
  palette,
}: {
  items: number[];
  onChoose: (item: number) => void;
  palette: DateTimeInputViewProps['palette'];
  chosen?: number;
}) => {
  const list = useRef<ScrollViewRef>(null);
  const placed = useRef(false);
  return (
    <ScrollView contentContainerStyle={styles.timeColumn} ref={list} style={styles.timeList}>
      {items.map((item) => {
        const isChosen = chosen === item;
        return (
          <Pressable
            accessibilityRole='button'
            accessibilityState={{ selected: isChosen }}
            key={item}
            // The sheet opens with the chosen value in the middle of its list, once.
            onLayout={
              isChosen
                ? ({ nativeEvent: { layout } }) => {
                    if (placed.current) return;
                    placed.current = true;
                    list.current?.scrollTo({
                      animated: false,
                      y: Math.max(0, layout.y - (TIME_HEIGHT - layout.height) / 2),
                    });
                  }
                : undefined
            }
            onPress={() => onChoose(item)}
            style={[styles.timeItem, isChosen && { backgroundColor: palette.accent }]}
          >
            <Text style={[styles.timeText, { color: isChosen ? palette.onAccent : palette.text }]}>
              {two(item)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

/** The field and the sheet it opens. */
export const DateTimeInputView = ({
  enableDate,
  enableTime,
  hasError,
  inputStyle,
  label,
  max,
  min,
  onChange,
  palette,
  value,
}: DateTimeInputViewProps) => {
  const { t, userLanguage } = useAITranslation();
  const [open, setOpen] = useReplyState(false);
  const moment = useMemo(() => parseMoment(value), [value]);
  const today = new Date();
  const [shown, setShown] = useReplyState(() => ({
    month: moment.day?.month ?? today.getMonth(),
    year: moment.day?.year ?? today.getFullYear(),
  }));
  const lowest = min ? parseMoment(min).day : undefined;
  const highest = max ? parseMoment(max).day : undefined;

  const write = (next: Moment) => onChange?.(formatMoment(next, { enableDate, enableTime }));

  const shownText = useMemo(() => {
    const parts: string[] = [];
    if (enableDate && moment.day) {
      parts.push(
        new Date(moment.day.year, moment.day.month, moment.day.date).toLocaleDateString(
          userLanguage,
          { day: 'numeric', month: 'short', weekday: 'short', year: 'numeric' },
        ),
      );
    }
    if (enableTime && moment.hours !== undefined) {
      parts.push(
        new Date(2000, 0, 1, moment.hours, moment.minutes ?? 0).toLocaleTimeString(userLanguage, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    }
    return parts.join(', ');
  }, [enableDate, enableTime, moment, userLanguage]);

  const monthTitle = new Date(shown.year, shown.month, 1).toLocaleDateString(userLanguage, {
    month: 'long',
    year: 'numeric',
  });
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Date(2021, 2, 1 + index).toLocaleDateString(userLanguage, { weekday: 'narrow' }),
  );
  const step = (by: number) =>
    setShown(({ month, year }) => {
      const next = new Date(year, month + by, 1);
      return { month: next.getMonth(), year: next.getFullYear() };
    });

  const field: ViewStyle = {
    backgroundColor: palette.surface,
    borderColor: hasError ? palette.error : palette.border,
  };

  return (
    <>
      <Pressable
        accessibilityHint={label}
        accessibilityLabel={shownText || label}
        accessibilityRole='button'
        disabled={!onChange}
        onPress={() => setOpen(true)}
        style={[styles.field, field, inputStyle as ViewStyle]}
      >
        <Text style={[styles.value, { color: shownText ? palette.text : palette.secondaryText }]}>
          {shownText || label || ' '}
        </Text>
      </Pressable>
      <Modal animationType='slide' onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable
          accessibilityLabel={t('a2ui.dateTimeInput.close.accessibilityLabel', 'Close')}
          onPress={() => setOpen(false)}
          style={styles.backdrop}
        />
        <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: palette.text }]}>{label ?? ''}</Text>
            <Pressable accessibilityRole='button' hitSlop={12} onPress={() => setOpen(false)}>
              <Text style={[styles.close, { color: palette.accent }]}>
                {t('a2ui.dateTimeInput.close.label', 'Close')}
              </Text>
            </Pressable>
          </View>
          {enableDate ? (
            <View>
              <View style={styles.monthRow}>
                <Pressable accessibilityRole='button' hitSlop={12} onPress={() => step(-1)}>
                  <Text style={[styles.arrow, { color: palette.accent }]}>
                    {I18nManager.isRTL ? '›' : '‹'}
                  </Text>
                </Pressable>
                <Text accessibilityRole='header' style={[styles.month, { color: palette.text }]}>
                  {monthTitle}
                </Text>
                <Pressable accessibilityRole='button' hitSlop={12} onPress={() => step(1)}>
                  <Text style={[styles.arrow, { color: palette.accent }]}>
                    {I18nManager.isRTL ? '‹' : '›'}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.week}>
                {weekdays.map((weekday, index) => (
                  <Text key={index} style={[styles.weekday, { color: palette.secondaryText }]}>
                    {weekday}
                  </Text>
                ))}
              </View>
              {weeksOf(shown.year, shown.month).map((week, row) => (
                <View key={row} style={styles.week}>
                  {week.map((date, column) => {
                    if (date === undefined) return <View key={column} style={styles.day} />;
                    const day = { date, month: shown.month, year: shown.year };
                    const disabled =
                      (!!lowest && dayNumber(day) < dayNumber(lowest)) ||
                      (!!highest && dayNumber(day) > dayNumber(highest));
                    const chosen = sameDay(day, moment.day);
                    return (
                      <Pressable
                        accessibilityLabel={new Date(
                          day.year,
                          day.month,
                          day.date,
                        ).toLocaleDateString(userLanguage, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        accessibilityRole='button'
                        accessibilityState={{ disabled, selected: chosen }}
                        disabled={disabled}
                        key={column}
                        onPress={() => write({ ...moment, day })}
                        style={[styles.day, chosen && { backgroundColor: palette.accent }]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            {
                              color: chosen
                                ? palette.onAccent
                                : disabled
                                  ? palette.border
                                  : palette.text,
                            },
                          ]}
                        >
                          {date}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}
          {enableTime ? (
            <View style={styles.time}>
              {[
                { items: HOURS, key: 'hours' as const },
                { items: MINUTES, key: 'minutes' as const },
              ].map(({ items, key }) => (
                <TimeColumn
                  chosen={moment[key]}
                  items={items}
                  key={key}
                  onChoose={(item) =>
                    write({
                      ...moment,
                      hours: key === 'hours' ? item : (moment.hours ?? 0),
                      minutes: key === 'minutes' ? item : (moment.minutes ?? 0),
                    })
                  }
                  palette={palette}
                />
              ))}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  arrow: { fontSize: 28, paddingHorizontal: primitives.spacingSm },
  backdrop: { backgroundColor: '#00000040', flex: 1 },
  close: { fontSize: primitives.typographyFontSizeMd, fontWeight: '600' },
  day: { alignItems: 'center', borderRadius: 18, flex: 1, height: 36, justifyContent: 'center' },
  dayText: { fontSize: primitives.typographyFontSizeMd },
  field: {
    borderRadius: primitives.radiusMd,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  month: { fontSize: primitives.typographyFontSizeMd, fontWeight: '600' },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: primitives.spacingXs,
  },
  sheet: {
    borderTopLeftRadius: primitives.radiusXl,
    borderTopRightRadius: primitives.radiusXl,
    gap: primitives.spacingSm,
    paddingBottom: primitives.spacingXl,
    paddingHorizontal: primitives.spacingMd,
    paddingTop: primitives.spacingMd,
  },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetTitle: { fontSize: primitives.typographyFontSizeMd, fontWeight: '600' },
  time: { flexDirection: 'row', gap: primitives.spacingSm, height: TIME_HEIGHT },
  timeColumn: { gap: 2 },
  timeItem: { alignItems: 'center', borderRadius: primitives.radiusMd, paddingVertical: 8 },
  timeList: { flex: 1 },
  timeText: { fontSize: primitives.typographyFontSizeMd },
  value: { fontSize: primitives.typographyFontSizeMd },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, fontSize: primitives.typographyFontSizeXs, textAlign: 'center' },
});
