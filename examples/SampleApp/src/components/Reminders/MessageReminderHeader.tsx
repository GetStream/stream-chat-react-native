import {
  MessageHeaderProps,
  MessagePinnedHeader,
  Time,
  useMessageContext,
  useMessageReminder,
  useStateStore,
  useTheme,
  useTranslationContext,
} from 'stream-chat-react-native';
import { ReminderState } from 'stream-chat';
import { StyleSheet, Text, View } from 'react-native';

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

export const MessageReminderHeader = ({ message }: MessageHeaderProps) => {
  const messageId = message?.id ?? '';
  const reminder = useMessageReminder(messageId);
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};
  const { t } = useTranslationContext();

  const {
    theme: { semantics },
  } = useTheme();

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
        <Time height={16} width={16} stroke={semantics.chatTextTimestamp} />
        <Text style={[styles.headerTitle, { color: semantics.chatTextTimestamp }]}>
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

export const MessageHeader = () => {
  const { message } = useMessageContext();
  return (
    <>
      <MessageReminderHeader message={message} />
      <MessagePinnedHeader />
    </>
  );
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
