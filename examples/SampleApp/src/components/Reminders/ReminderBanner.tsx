import { StyleSheet, Text, View } from 'react-native';

import { nsToDate, nsToMs, ReminderResponse, ReminderState } from 'stream-chat';
import {
  useMessageReminder,
  useTheme,
  useTranslationContext,
  useStateStore,
} from 'stream-chat-react-native';

import { useLegacyColors } from '../../theme/useLegacyColors';

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

export const ReminderBanner = (item: ReminderResponse) => {
  useTheme();
  const { accent_blue, accent_red } = useLegacyColors();
  const { t } = useTranslationContext();
  const { message_id } = item;
  const reminder = useMessageReminder(message_id);
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};
  const stopRefreshBoundaryMs = reminder?.timer.stopRefreshBoundaryMs;
  // `remindAt` is a unix-**nanosecond** wire timestamp while `stopRefreshBoundaryMs` is a
  // millisecond duration, so the timestamp is converted before the two are added.
  const stopRefreshTimeStamp =
    reminder?.remindAt && stopRefreshBoundaryMs
      ? nsToMs(reminder.remindAt) + stopRefreshBoundaryMs
      : undefined;

  const isBehindRefreshBoundary =
    !!stopRefreshTimeStamp && new Date().getTime() > stopRefreshTimeStamp;

  if (!reminder?.remindAt) {
    return <Text style={styles.date}>🔖</Text>;
  } else if (reminder.remindAt && timeLeftMs) {
    return (
      <View
        style={[
          styles.bannerContainer,
          { backgroundColor: timeLeftMs > 0 ? accent_blue : accent_red },
        ]}
      >
        <Text style={styles.date}>
          {isBehindRefreshBoundary
            ? t('Due since {{ dueSince }}', {
                dueSince: t('timestamp/ReminderNotification', {
                  timestamp: nsToDate(reminder.remindAt),
                }),
              })
            : t('Due {{ timeLeft }}', {
                timeLeft: t('duration/Message reminder', {
                  milliseconds: timeLeftMs,
                }),
              })}
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  bannerContainer: {
    paddingHorizontal: 8,
    borderRadius: 16,
    paddingVertical: 4,
  },
  date: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
});
