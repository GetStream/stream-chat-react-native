import {
  MessageFooterProps,
  Time,
  useStateStore,
  useTranslationContext,
} from 'stream-chat-react-native';
import { useMessageReminder } from '../../hooks/useMessageReminder';
import { ReminderState } from 'stream-chat';
import { StyleSheet, Text, View } from 'react-native';

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

export const MessageReminderHeader = ({ message }: MessageFooterProps) => {
  const messageId = message?.id ?? '';
  const reminder = useMessageReminder(messageId);
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};
  const { t } = useTranslationContext();

  const stopRefreshBoundaryMs = reminder?.timer.stopRefreshBoundaryMs;
  const stopRefreshTimeStamp =
    reminder?.remindAt && stopRefreshBoundaryMs
      ? reminder?.remindAt.getTime() + stopRefreshBoundaryMs
      : undefined;

  const isBehindRefreshBoundary =
    !!stopRefreshTimeStamp && new Date().getTime() > stopRefreshTimeStamp;

  if (!reminder) {
    return null;
  }

  // This is for "Saved for Later"
  if (!reminder.remindAt) {
    return (
      <View>
        <Text style={styles.headerTitle}>🔖 Saved for Later</Text>
      </View>
    );
  }

  if (reminder.remindAt && timeLeftMs !== null) {
    return (
      <View style={styles.headerContainer}>
        <Time height={16} width={16} />
        <Text style={styles.headerTitle}>
          {isBehindRefreshBoundary
            ? t('Due since {{ dueSince }}', {
                dueSince: t('timestamp/ReminderNotification', {
                  timestamp: reminder.remindAt,
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});
